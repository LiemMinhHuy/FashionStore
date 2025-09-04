from django.utils import timezone

from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from ckeditor.fields import RichTextField
from django.core import validators
from rest_framework.exceptions import ValidationError
from django.db.models import Sum, F, FloatField

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
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    image = models.ImageField(upload_to='products/%Y/%m', default=None)
    quantity = models.PositiveIntegerField(default=0)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

    def liked_products(self):
        return Product.objects.filter(like__user=self)

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
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Cash')
    shipping_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, related_name='shipping_orders')
    billing_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='billing_orders')
    payment_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    points_earned = models.IntegerField(default=0, help_text="Points earned from this order")
    points_claimed = models.BooleanField(default=False, help_text="Whether points have been claimed by customer")
    
    def calculate_points(self):
        """Calculate points based on order total: 1 point per $10"""
        if self.total_amount >= 10:
            return int(self.total_amount / 10)
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



