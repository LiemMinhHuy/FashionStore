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
    class Meta:
        permissions = customer_permission

class Staff(User):
    class Meta:
        permissions = staff_permission

class Category(BaseModel):
    name = models.CharField(max_length=100, null=False, unique=True)

    def __str__(self):
        return self.name

class Product(BaseModel):
    name = models.CharField(max_length=255, null=False)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    image = models.ImageField(upload_to='products/%Y/%m', default=None)
    quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name

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

class Order(BaseModel):
    PAYMENT_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
        ('Refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('VNPay', 'VNPay'),
        ('Cash', 'Tiền mặt'),
        ('CreditCard', 'Thẻ tín dụng'),
        ('BankTransfer', 'Chuyển khoản ngân hàng'),
    ]

    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Cash')
    shipping_address = models.CharField(max_length=255)

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



