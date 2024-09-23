from datetime import datetime
import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django_seed import Seed

from api.models import User, Category, Product, Cart, CartItem, Order, OrderDetail, News, Like, Customer

class Command(BaseCommand):
    help = "Seed the database with initial data for testing and development."

    def handle(self, *args, **options):
        seeder = Seed.seeder(locale="en_US")

        # Tạo dữ liệu mẫu cho bảng User
        seeder.add_entity(User, 50, {
            "avatar": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample",
            "last_login": None,
            "password": make_password("password123"),
            "is_superuser": False,
            "is_staff": False,
            "email": lambda x: seeder.faker.email(),
            "username": lambda x: seeder.faker.user_name(),
        })

        # Tạo dữ liệu mẫu cho bảng Customer
        seeder.add_entity(Customer, 150, {
            "avatar": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample",
            "last_login": None,
            "password": make_password("password123"),
            "email": lambda x: seeder.faker.email(),
            "username": lambda x: seeder.faker.user_name(),
        })

        # Tạo dữ liệu mẫu cho bảng Category
        seeder.add_entity(Category, 50, {
            "name": lambda x: seeder.faker.word(),
        })

        # Thực thi việc tạo dữ liệu mẫu cho User và Category trước để dùng trong các bảng khác
        inserted_pks = seeder.execute()

        # Lấy các bản ghi đã tạo để sử dụng cho các bảng có liên kết
        categories = list(Category.objects.all())
        customers = list(Customer.objects.all())

        # Tạo dữ liệu mẫu cho bảng Product
        seeder.add_entity(Product, 200, {
            "name": lambda x: seeder.faker.word(),
            "price": lambda x: round(random.uniform(10.0, 500.0), 2),
            "category": lambda x: random.choice(categories),
            "image": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5"
        })

        # Tạo dữ liệu mẫu cho bảng Cart
        seeder.add_entity(Cart, 200, {
            "user": lambda x: random.choice(customers),
        })

        # Thực thi việc tạo dữ liệu mẫu cho Product và Cart
        inserted_pks.update(seeder.execute())

        # Lấy các bản ghi đã tạo để sử dụng cho các bảng có liên kết
        carts = list(Cart.objects.all())
        products = list(Product.objects.all())

        # Tạo dữ liệu mẫu cho bảng CartItem
        seeder.add_entity(CartItem, 200, {
            "cart": lambda x: random.choice(carts),
            "product": lambda x: random.choice(products),
            "quantity": lambda x: random.randint(1, 5)
        })

        # Tạo dữ liệu mẫu cho bảng Order
        seeder.add_entity(Order, 200, {
            "user": lambda x: random.choice(customers),
            "total_amount": lambda x: round(random.uniform(50.0, 1000.0), 2),
            "payment_status": lambda x: random.choice(["Paid", "Pending", "Failed"]),
            "shipping_address": lambda x: random.choice(["123 Main St", "456 Elm St", "789 Oak St", "321 Pine St", "654 Maple Ave"])
        })

        # Thực thi việc tạo dữ liệu mẫu cho CartItem và Order
        inserted_pks.update(seeder.execute())

        # Lấy các bản ghi đã tạo để sử dụng cho các bảng có liên kết
        orders = list(Order.objects.all())

        # Tạo dữ liệu mẫu cho bảng OrderDetail
        seeder.add_entity(OrderDetail, 200, {
            "order": lambda x: random.choice(orders),
            "product": lambda x: random.choice(products),
            "quantity": lambda x: random.randint(1, 3),
            "unit_price": lambda x: random.choice([product.price for product in products]),
            "totalPrice": lambda x: random.choice([product.price for product in products]) * random.randint(1, 3)
        })

        # Tạo dữ liệu mẫu cho bảng News
        seeder.add_entity(News, 200, {
            "title": lambda x: seeder.faker.sentence(),
            "content": lambda x: seeder.faker.paragraph(),
            "image": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5"
        })

        # Tạo dữ liệu mẫu cho bảng Like
        seeder.add_entity(Like, 200, {
            "user": lambda x: random.choice(customers),
            "news": lambda x: random.choice(News.objects.all()),
        })

        inserted_pks.update(seeder.execute())

        self.stdout.write(self.style.SUCCESS('Database seeded successfully with initial data for Fashion Store.'))
