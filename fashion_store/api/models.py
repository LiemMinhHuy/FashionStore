from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from ckeditor.fields import RichTextField
from django.core import validators
from django.db.models import Sum
from rest_framework.exceptions import ValidationError

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

    def __str__(self):
        return self.name

class Cart(BaseModel):
    user = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='carts')


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField()

class Order(BaseModel):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=50)
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

class Like(BaseModel):
    user = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='likes')
    news = models.ForeignKey(News, on_delete=models.CASCADE, related_name='likes')

    class Meta:
        unique_together = ('user', 'news')
