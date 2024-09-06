from datetime import datetime, timedelta
import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django_seed import Seed

from api.models import User, Category, Product, Cart, CartItem, Order, OrderDetail, News, Like

# Danh sách mẫu cho dữ liệu
category_names = ["T-shirts", "Jeans", "Jackets", "Shoes", "Accessories"]
product_names = ["Basic Tee", "Slim Jeans", "Leather Jacket", "Running Shoes", "Sunglasses"]
shipping_addresses = ["123 Main St", "456 Elm St", "789 Oak St", "321 Pine St", "654 Maple Ave"]
payment_statuses = ["Paid", "Pending", "Failed"]

class Command(BaseCommand):
    help = "Seed the database with initial data for testing and development."

    def handle(self, *args, **options):
        seeder = Seed.seeder(locale="en_US")

        # Tạo dữ liệu mẫu cho bảng User
        seeder.add_entity(User, 10, {
            "avatar": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample",
            "last_login": None,
            "password": make_password("password123"),
            "is_superuser": False,
            "is_staff": False,
            "email": lambda x: seeder.faker.email(),
            "username": lambda x: seeder.faker.user_name(),
        })

        # Tạo dữ liệu mẫu cho bảng Category
        seeder.add_entity(Category, len(category_names), {
            "name": lambda x: category_names.pop(),
        })

        # Thực thi việc tạo dữ liệu mẫu cho User và Category trước để dùng trong các bảng khác
        inserted_pks = seeder.execute()

        # Lấy các bản ghi đã tạo để sử dụng cho các bảng có liên kết
        categories = list(Category.objects.all())
        users = list(User.objects.all())

        # Tạo dữ liệu mẫu cho bảng Product
        seeder.add_entity(Product, len(product_names), {
            "name": lambda x: product_names.pop(),
            "price": lambda x: round(random.uniform(10.0, 500.0), 2),
            "category": lambda x: random.choice(categories),
            "image": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5"
        })

        # Tạo dữ liệu mẫu cho bảng Cart
        seeder.add_entity(Cart, 10, {
            "user": lambda x: random.choice(users),
        })

        # Thực thi việc tạo dữ liệu mẫu cho Product và Cart
        inserted_pks.update(seeder.execute())

        # Lấy các bản ghi đã tạo để sử dụng cho các bảng có liên kết
        carts = list(Cart.objects.all())
        products = list(Product.objects.all())

        # Tạo dữ liệu mẫu cho bảng CartItem
        seeder.add_entity(CartItem, 50, {
            "cart": lambda x: random.choice(carts),
            "product": lambda x: random.choice(products),
            "quantity": lambda x: random.randint(1, 5)
        })

        # Tạo dữ liệu mẫu cho bảng Order
        seeder.add_entity(Order, 10, {
            "user": lambda x: random.choice(users),
            "total_amount": lambda x: round(random.uniform(50.0, 1000.0), 2),
            "payment_status": lambda x: random.choice(payment_statuses),
            "shipping_address": lambda x: random.choice(shipping_addresses)
        })

        # Thực thi việc tạo dữ liệu mẫu cho CartItem và Order
        inserted_pks.update(seeder.execute())

        # Lấy các bản ghi đã tạo để sử dụng cho các bảng có liên kết
        orders = list(Order.objects.all())

        # Tạo dữ liệu mẫu cho bảng OrderDetail
        seeder.add_entity(OrderDetail, 50, {
            "order": lambda x: random.choice(orders),
            "product": lambda x: random.choice(products),
            "quantity": lambda x: random.randint(1, 3),
            "unit_price": lambda x: random.choice([product.price for product in products]),
            "totalPrice": lambda x: random.choice([product.price for product in products]) * random.randint(1, 3)
        })

        # Tạo dữ liệu mẫu cho bảng News
        seeder.add_entity(News, 10, {
            "title": lambda x: seeder.faker.sentence(),
            "content": lambda x: seeder.faker.paragraph(),
            "image": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5"
        })

        # Tạo dữ liệu mẫu cho bảng Like
        seeder.add_entity(Like, 50, {
            "user": lambda x: random.choice(users),
            "news": lambda x: random.choice(News.objects.all()),
        })

        # Thực thi việc tạo dữ liệu mẫu cuối cùng
        inserted_pks.update(seeder.execute())

        self.stdout.write(self.style.SUCCESS('Database seeded successfully with initial data for Fashion Store.'))
