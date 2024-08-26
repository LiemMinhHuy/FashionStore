from django.contrib import admin
from api.models import User, Category, Product, Cart, CartItem, Order, OrderDetail, News, NewsComment, Like


# Register your models here.
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Order)

