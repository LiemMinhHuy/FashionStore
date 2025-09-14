from django.utils import timezone
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError as DjangoValidationError
from decimal import Decimal, ROUND_HALF_UP
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from ckeditor.fields import RichTextField
from django.core import validators
from rest_framework.exceptions import ValidationError
from django.db.models import Sum, F, FloatField
import uuid

customer_permission = [('customer', 'Has customer permissions')]
staff_permission = [('staff', 'Has staff permissions')]

class BaseModel(models.Model):
    class Meta:
        abstract = True

    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True, null=False)
    is_active = models.BooleanField(default=True)

class User(AbstractUser):
    avatar = CloudinaryField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True, null=False)

class Customer(User):
    point = models.IntegerField(default=0)
    phone = models.CharField(max_length=15, blank=True, null=True, default='')
    
    class Meta:
        permissions = customer_permission

class Address(BaseModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=255, verbose_name="Họ và tên")
    phone = models.CharField(max_length=15, verbose_name="Số điện thoại")
    
    # Địa chỉ chi tiết cho VN
    address_line1 = models.CharField(max_length=255, verbose_name="Số nhà, đường, phường/xã")
    address_line2 = models.CharField(max_length=255, blank=True, null=True, verbose_name="Tòa nhà, căn hộ (nếu có)")
    
    # Địa chỉ hành chính VN
    province = models.CharField(max_length=100, verbose_name="Tỉnh/Thành phố")
    district = models.CharField(max_length=100, verbose_name="Quận/Huyện")
    ward = models.CharField(max_length=100, verbose_name="Phường/Xã")
    
    postal_code = models.CharField(max_length=10, verbose_name="Mã bưu điện")
    country = models.CharField(max_length=100, default='Vietnam', verbose_name="Quốc gia")
    
    # Loại địa chỉ
    is_default = models.BooleanField(default=False, verbose_name="Địa chỉ mặc định")
    is_billing = models.BooleanField(default=False, verbose_name="Địa chỉ thanh toán")
    is_shipping = models.BooleanField(default=True, verbose_name="Địa chỉ giao hàng")
    
    # Ghi chú cho VN
    note = models.TextField(blank=True, null=True, verbose_name="Ghi chú giao hàng")
    
    class Meta:
        verbose_name_plural = "Địa chỉ"
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.full_name} - {self.address_line1}, {self.ward}, {self.district}, {self.province}"
    
    def save(self, *args, **kwargs):
        # Nếu đây là địa chỉ mặc định, bỏ mặc định các địa chỉ khác
        if self.is_default:
            Address.objects.filter(customer=self.customer, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
    
    @property
    def full_address(self):
        """Trả về địa chỉ đầy đủ theo format VN"""
        address_parts = [self.address_line1]
        if self.address_line2:
            address_parts.append(self.address_line2)
        address_parts.extend([self.ward, self.district, self.province])
        return ', '.join(filter(None, address_parts))
    
    @property
    def short_address(self):
        """Trả về địa chỉ ngắn gọn"""
        return f"{self.address_line1}, {self.ward}, {self.district}"
    
    @property
    def administrative_address(self):
        """Trả về địa chỉ hành chính"""
        return f"{self.ward}, {self.district}, {self.province}"

class Staff(User):
    class Meta:
        permissions = staff_permission

class Category(BaseModel):
    name = models.CharField(max_length=100, null=False, unique=True)

    def __str__(self):
        return self.name

    def liked_by_users(self):
        return User.objects.filter(like__product=self)

class Product(BaseModel):
    name = models.CharField(max_length=255, null=False)
    price = models.DecimalField(max_digits=10, decimal_places=0, null=False)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    thumbnail = models.ImageField(upload_to='products/%Y/%m', default=None)
    quantity = models.PositiveIntegerField(default=0)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    def liked_products(self):
        return Product.objects.filter(like__user=self)

class ProductImage(models.Model):
    """Ảnh phụ cho từng sản phẩm"""
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/%Y/%m')

    def __str__(self):
        return f"Image of {self.product.name}"

class Cart(BaseModel):
    user = models.OneToOneField('Customer', on_delete=models.CASCADE, related_name='cart')

    @property
    def total_amount(self):
        return self.items.aggregate(
            total=Sum(F('quantity') * F('product__price'), output_field=FloatField())
        )['total'] or 0


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ('cart', 'product')

    @property
    def total_price(self):
        return self.quantity * self.product.price

STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Processing', 'Processing'),
    ('Shipping', 'Shipping'),
    ('Completed', 'Completed'),
    ('Failed', 'Failed'),
    ('Canceled', 'Canceled'),
    ('Expired', 'Expired'),
    ('Refunding', 'Refunding'),
    ('Refunded', 'Refunded'),
    ('Chargeback', 'Chargeback'),
]

class Order(BaseModel):
    PAYMENT_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipping', 'Shipping'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
        ('Canceled', 'Canceled'),
        ('Expired', 'Expired'),
        ('Refunding', 'Refunding'),
        ('Refunded', 'Refunded'),
        ('Chargeback', 'Chargeback'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('PayPal', 'PayPal'),
        ('VNPay', 'VNPay'),
    ]

    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    original_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Original amount before discount")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total discount applied")
    coupon = models.ForeignKey('Coupon', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Cash')
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='shipping_orders')
    billing_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='billing_orders')
    payment_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    points_earned = models.IntegerField(default=0, help_text="Points earned from this order")
    points_claimed = models.BooleanField(default=False, help_text="Whether points have been claimed by customer")
    
    def calculate_points(self):
        """Calculate points based on order total: 1 point per $1 USD"""
        if self.total_amount >= 1:
            return int(self.total_amount)
        return 0
    
    def can_claim_points(self):
        """Check if customer can claim points for this order"""
        return (self.status == 'Completed' and 
                not self.points_claimed and 
                self.points_earned > 0)
    
    def claim_points(self):
        """Claim points for this order and add to customer's total"""
        if self.can_claim_points():
            self.user.point += self.points_earned
            self.user.save()
            self.points_claimed = True
            self.save()
            return True
        return False

class OrderDetail(BaseModel):
    order = models.ForeignKey(Order, models.CASCADE, related_name='order_details')
    product = models.ForeignKey(Product, models.CASCADE, related_name='order_items')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    totalPrice = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

class News(BaseModel):
    title = models.CharField(max_length=255, null=False)
    content = RichTextField()
    image = CloudinaryField('Image', null=True, blank=True)

    def __str__(self):
        return self.title

class NewsComment(BaseModel):
    news = models.ForeignKey(News, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='news_comments')
    content = models.TextField()
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')


class Interaction(BaseModel):  # Kế thừa BaseModel
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.user_id} - {self.product_id}'

    class Meta:
        abstract = True

class Like(Interaction):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True)   # Replace with a valid Product ID

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'product'], name='unique_user_product_like')
        ]


# Coupon System Models
class Coupon(BaseModel):
    """Coupon model for discount system"""
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed_amount', 'Fixed Amount'),
        ('free_shipping', 'Free Shipping'),
    ]
    
    COUPON_TYPE_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('first_time', 'First Time Customer'),
        ('loyalty', 'Loyalty Reward'),
    ]
    
    code = models.CharField(max_length=50, unique=True, help_text="Unique coupon code")
    name = models.CharField(max_length=200, help_text="Coupon name for admin")
    description = models.TextField(help_text="Coupon description for customers")
    
    # Discount settings
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage or fixed amount")
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Maximum discount for percentage type")
    
    # Usage conditions
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Minimum order amount to use coupon")
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total usage limit (null = unlimited)")
    usage_limit_per_customer = models.PositiveIntegerField(default=1, help_text="Usage limit per customer")
    
    # Time validity
    valid_from = models.DateTimeField(help_text="Coupon valid from date")
    valid_until = models.DateTimeField(help_text="Coupon expiry date")
    
    # Coupon type and targeting
    coupon_type = models.CharField(max_length=20, choices=COUPON_TYPE_CHOICES, default='public')
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    used_count = models.PositiveIntegerField(default=0, help_text="Total times this coupon has been used")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def clean(self):
        """Validate coupon data"""
        # Check date validity
        if self.valid_from and self.valid_until and self.valid_from >= self.valid_until:
            raise DjangoValidationError("Valid from date must be before valid until date")
        
        # Check discount value
        if self.discount_type == 'percentage' and (self.discount_value < 0 or self.discount_value > 100):
            raise DjangoValidationError("Percentage discount must be between 0 and 100")
        
        if self.discount_type == 'fixed_amount' and self.discount_value < 0:
            raise DjangoValidationError("Fixed amount discount must be positive")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_valid(self):
        """Check if coupon is currently valid"""
        now = timezone.now()
        return (
            self.is_active and
            self.valid_from <= now <= self.valid_until and
            (self.usage_limit is None or self.used_count < self.usage_limit)
        )
    
    @property
    def is_expired(self):
        """Check if coupon is expired"""
        return timezone.now() > self.valid_until
    
    @property
    def usage_remaining(self):
        """Get remaining usage count"""
        if self.usage_limit is None:
            return None
        return max(0, self.usage_limit - self.used_count)
    
    def can_be_used_by_customer(self, customer, order_amount=None):
        """Check if coupon can be used by specific customer"""
        if not self.is_valid:
            return False, "Coupon is not valid or has expired"
        
        # Check minimum order amount
        if order_amount and order_amount < self.min_order_amount:
            return False, f"Minimum order amount is {self.min_order_amount}"
        
        # Check customer usage limit
        from api.models import CouponUsage, Order, CustomerCoupon  # Import here to avoid circular import
        customer_usage = CouponUsage.objects.filter(
            coupon=self, customer=customer
        ).count()
        
        if customer_usage >= self.usage_limit_per_customer:
            return False, "You have reached the usage limit for this coupon"
        
        # Check for first-time customer coupons
        if self.coupon_type == 'first_time':
            if Order.objects.filter(user=customer, status='Completed').exists():
                return False, "This coupon is only for first-time customers"
        
        # Check for private coupons
        if self.coupon_type == 'private':
            if not CustomerCoupon.objects.filter(customer=customer, coupon=self).exists():
                return False, "This coupon is not available for your account"
        
        return True, "Coupon can be used"
    
    def calculate_discount(self, order_amount):
        """Calculate discount amount for given order"""
        if self.discount_type == 'percentage':
            discount = order_amount * (self.discount_value / 100)
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return discount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        elif self.discount_type == 'fixed_amount':
            return min(self.discount_value, order_amount)
        
        elif self.discount_type == 'free_shipping':
            # Return shipping cost (you might want to pass this as parameter)
            return Decimal('30.00')  # Default shipping cost in USD
        
        return Decimal('0')
    
    def apply_to_order(self, customer, order_amount):
        """Apply coupon to order and create usage record"""
        can_use, message = self.can_be_used_by_customer(customer, order_amount)
        if not can_use:
            raise ValidationError(message)
        
        discount_amount = self.calculate_discount(order_amount)
        
        # Create usage record
        from api.models import CouponUsage  # Import here to avoid circular import
        CouponUsage.objects.create(
            coupon=self,
            customer=customer,
            order_amount=order_amount,
            discount_amount=discount_amount
        )
        
        # Update usage count
        self.used_count += 1
        self.save()
        
        return discount_amount


class CustomerCoupon(BaseModel):
    """Model for assigning private coupons to specific customers"""
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='assigned_coupons')
    coupon = models.ForeignKey('Coupon', on_delete=models.CASCADE, related_name='assigned_customers')
    assigned_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, help_text="Staff who assigned this coupon")
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['customer', 'coupon']
        verbose_name = "Customer Coupon Assignment"
        verbose_name_plural = "Customer Coupon Assignments"
    
    def __str__(self):
        return f"{self.customer.username} - {self.coupon.code}"


class CouponUsage(BaseModel):
    """Model to track coupon usage history"""
    coupon = models.ForeignKey('Coupon', on_delete=models.CASCADE, related_name='usage_history')
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='coupon_usage')
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='coupon_usage')
    
    # Usage details
    order_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Order amount when coupon was used")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Actual discount applied")
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-used_at']
        verbose_name = "Coupon Usage"
        verbose_name_plural = "Coupon Usage History"
    
    def __str__(self):
        return f"{self.customer.username} used {self.coupon.code} - {self.discount_amount} discount"


# Signal to create welcome coupon for new customers
@receiver(post_save, sender=Customer)
def create_welcome_coupon_for_new_customer(sender, instance, created, **kwargs):
    """Create a welcome coupon for newly registered customers"""
    if created:
        # Check if a welcome coupon template exists
        try:
            welcome_coupon_template = Coupon.objects.filter(
                coupon_type='first_time',
                code='WELCOME_NEW_CUSTOMER',
                is_active=True
            ).first()
            
            if not welcome_coupon_template:
                # Create a default welcome coupon template if it doesn't exist
                valid_from = timezone.now()
                valid_until = valid_from + timedelta(days=30)  # Valid for 30 days
                
                welcome_coupon_template = Coupon.objects.create(
                    code='WELCOME_NEW_CUSTOMER',
                    name='Welcome New Customer',
                    description='Welcome discount for new customers - 15% off your first order',
                    discount_type='percentage',
                    discount_value=Decimal('15.00'),
                    max_discount_amount=Decimal('100.00'),  # Max $100 USD discount
                    min_order_amount=Decimal('200.00'),    # Min $200 USD order
                    usage_limit=None,  # Unlimited total usage
                    usage_limit_per_customer=1,
                    valid_from=valid_from,
                    valid_until=valid_until + timedelta(days=365),  # Template valid for 1 year
                    coupon_type='first_time',
                    is_active=True
                )
            
            # Create a personal welcome coupon for the new customer
            customer_code = f"WELCOME{instance.id:04d}"
            valid_from = timezone.now()
            valid_until = valid_from + timedelta(days=30)  # Valid for 30 days
            
            personal_coupon = Coupon.objects.create(
                code=customer_code,
                name=f'Welcome {instance.first_name or instance.username}',
                description='Welcome to our store! Enjoy 15% off your first order.',
                discount_type=welcome_coupon_template.discount_type,
                discount_value=welcome_coupon_template.discount_value,
                max_discount_amount=welcome_coupon_template.max_discount_amount,
                min_order_amount=welcome_coupon_template.min_order_amount,
                usage_limit=1,  # Only this customer can use it once
                usage_limit_per_customer=1,
                valid_from=valid_from,
                valid_until=valid_until,
                coupon_type='private',  # Make it private for this customer
                is_active=True
            )
            
            # Assign the private coupon to the customer
            CustomerCoupon.objects.create(
                customer=instance,
                coupon=personal_coupon
            )
            
        except Exception as e:
            # Log the error but don't prevent customer creation
            print(f"Error creating welcome coupon for customer {instance.id}: {e}")



