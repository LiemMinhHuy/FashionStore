from datetime import datetime, timedelta
import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django_seed import Seed
from django_seed.providers import Provider

from api.models import User, Category, Product, Cart, CartItem, Order, OrderDetail, News, NewsComment, Like

# Danh sách tên danh mục sản phẩm mẫu
category_names = ["T-shirts", "Jeans", "Jackets", "Shoes", "Accessories"]

# Tên sản phẩm mẫu
product_names = ["Basic Tee", "Slim Jeans", "Leather Jacket", "Running Shoes", "Sunglasses"]

# Địa chỉ giao hàng mẫu
shipping_addresses = ["123 Main St", "456 Elm St", "789 Oak St", "321 Pine St", "654 Maple Ave"]

class Command(BaseCommand):
    help = "Seed the database with initial data for testing and development."

    def handle(self, *args, **options):
        seeder = Seed.seeder(locale="en_US")

        # Tạo dữ liệu mẫu cho bảng User
        seeder.add_entity(User, 10, {
            "avatar": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            "last_login": None,
            "password": make_password("password123"),  # Mật khẩu mặc định cho tất cả người dùng
            "is_superuser": False,
            "is_staff": False,
            "email": lambda x: seeder.faker.email()
        })

        # Tạo dữ liệu mẫu cho bảng Category
        seeder.add_entity(Category, len(category_names), {
            "name": lambda x: category_names.pop(),  # Lấy tên từ danh sách category_names
        })

        # Tạo dữ liệu mẫu cho bảng Product
        seeder.add_entity(Product, len(product_names), {
            "name": lambda x: product_names.pop(),  # Lấy tên từ danh sách product_names
            "price": lambda x: round(random.uniform(10.0, 500.0), 2),
            "category": lambda x: random.choice(Category.objects.all()),
            "image": "https://res.cloudinary.com/demo/image/upload/sample.jpg"
        })

        # Tạo dữ liệu mẫu cho bảng Cart
        seeder.add_entity(Cart, 10, {
            "user": lambda x: random.choice(User.objects.all()),
        })

        # Tạo dữ liệu mẫu cho bảng CartItem
        seeder.add_entity(CartItem, 50, {
            "cart": lambda x: random.choice(Cart.objects.all()),
            "product": lambda x: random.choice(Product.objects.all()),
            "quantity": lambda x: random.randint(1, 5)
        })

        # Tạo dữ liệu mẫu cho bảng Order
        seeder.add_entity(Order, 10, {
            "user": lambda x: random.choice(User.objects.all()),
            "total_amount": lambda x: round(random.uniform(50.0, 1000.0), 2),
            "payment_status": lambda x: random.choice(["Paid", "Pending", "Failed"]),
            "shipping_address": lambda x: random.choice(shipping_addresses)
        })

        # Tạo dữ liệu mẫu cho bảng OrderDetail
        seeder.add_entity(OrderDetail, 50, {
            "order": lambda x: random.choice(Order.objects.all()),
            "product": lambda x: random.choice(Product.objects.all()),
            "quantity": lambda x: random.randint(1, 3),
            "unit_price": lambda x: round(random.uniform(10.0, 500.0), 2),
            "totalPrice": lambda x: round(random.uniform(10.0, 1500.0), 2)
        })

        # Tạo dữ liệu mẫu cho bảng News
        seeder.add_entity(News, 10, {
            "title": lambda x: seeder.faker.sentence(),
            "content": lambda x: seeder.faker.paragraph(),
            "image": "https://res.cloudinary.com/demo/image/upload/sample.jpg"
        })

        # Tạo dữ liệu mẫu cho bảng NewsComment
        seeder.add_entity(NewsComment, 30, {
            "news": lambda x: random.choice(News.objects.all()),
            "user": lambda x: random.choice(User.objects.all()),
            "content": lambda x: seeder.faker.sentence(),
            "parent_comment": None  # Bỏ qua bình luận cha để tránh tạo mối quan hệ đệ quy phức tạp
        })

        # Tạo dữ liệu mẫu cho bảng Like
        seeder.add_entity(Like, 50, {
            "user": lambda x: random.choice(User.objects.all()),
            "news": lambda x: random.choice(News.objects.all()),
        })

        # Thực thi việc tạo dữ liệu mẫu
        inserted_pks = seeder.execute()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully with initial data for Fashion Store.'))
