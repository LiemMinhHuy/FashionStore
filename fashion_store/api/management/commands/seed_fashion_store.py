from datetime import datetime
import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django_seed import Seed

from api.models import User, Category, Product, Cart, CartItem, Order, OrderDetail, News, Like, Customer

class Command(BaseCommand):
    help = "Gieo dữ liệu vào cơ sở dữ liệu với dữ liệu ban đầu cho việc kiểm tra và phát triển."

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

        # Danh sách tên danh mục
        category_names = [
            "Jackets", "T-Shirts", "Shirts", "Vests", "Jeans",
            "Khaki Pants", "Sportswear", "Watches", "Glasses", "Belts", "Hats",
        ]

        # Tạo dữ liệu mẫu cho bảng Category
        self.stdout.write("Đang tạo danh mục...")
        categories = []
        for name in category_names:
            category, created = Category.objects.get_or_create(name=name)
            categories.append(category)
        self.stdout.write(self.style.SUCCESS(f'Đã tạo {len(categories)} danh mục.'))

        # Thực thi seeder cho User và Customer
        inserted_pks = seeder.execute()

        # Lấy tất cả khách hàng đã tạo
        customers = list(Customer.objects.all())

        # Định nghĩa tên sản phẩm cho từng danh mục
        category_product_names = {
            "Jackets": ["Leather Jacket", "Denim Jacket", "Bomber Jacket", "Puffer Jacket", "Windbreaker", "Blazer", "Field Jacket", "Trucker Jacket", "Overcoat", "Faux Fur Jacket"],
            "T-Shirts": ["Classic White T-Shirt", "Striped Polo Shirt", "Graphic Tee", "V-Neck T-Shirt", "Round Neck T-Shirt", "Henley T-Shirt", "Printed T-Shirt", "Tie-Dye T-Shirt", "Pocket T-Shirt", "Long Sleeve T-Shirt"],
            "Shirts": ["Oxford Shirt", "Chambray Shirt", "Flannel Shirt", "Button-Up Shirt", "Short Sleeve Shirt", "Dress Shirt", "Plaid Shirt", "Linen Shirt", "Hawaiian Shirt", "Tartan Shirt"],
            "Vests": ["Wool Blazer", "Casual Vest", "Double-Breasted Blazer", "Puffer Vest", "Denim Vest", "Formal Vest", "Utility Vest", "Leather Vest", "Fleece Vest", "Padded Vest"],
            "Jeans": ["Slim Fit Jeans", "Straight Leg Jeans", "Bootcut Jeans", "Skinny Jeans", "Relaxed Fit Jeans", "Flare Jeans", "Wide Leg Jeans", "High-Waisted Jeans", "Distressed Jeans", "Cropped Jeans"],
            "Khaki Pants": ["Slim Khaki Pants", "Chino Trousers", "Cargo Pants", "Classic Fit Khakis", "Relaxed Fit Chinos", "Tapered Khakis", "Pleated Khakis", "Khaki Shorts", "Linen Trousers", "Drawstring Pants"],
            "Sportswear": ["Running Shorts", "Yoga Pants", "Sports Tank Top", "Athletic Leggings", "Compression Shorts", "Sports Bra", "Joggers", "Windbreaker Pants", "Track Jacket", "Fleece Hoodie"],
            "Watches": ["Digital Watch", "Analog Watch", "Smartwatch", "Dive Watch", "Chronograph Watch", "Dress Watch", "Fitness Tracker", "Luxury Watch", "Sports Watch", "Smart Fitness Watch"],
            "Glasses": ["Aviator Sunglasses", "Round Glasses", "Wayfarer Sunglasses", "Cat-Eye Sunglasses", "Oversized Sunglasses", "Polarized Sunglasses", "Reading Glasses", "Bifocal Glasses", "Sunglasses with UV Protection", "Geek Chic Glasses"],
            "Belts": ["Leather Belt", "Canvas Belt", "Reversible Belt", "Braided Belt", "Dress Belt", "Casual Belt", "Wide Belt", "Thin Belt", "Elastic Belt", "Fashion Belt"],
            "Hats": ["Baseball Cap", "Beanie", "Fedora", "Snapback Cap", "Sun Hat", "Bucket Hat", "Cowboy Hat", "Panama Hat", "Newsboy Cap", "Beanie with Pom-Pom"],
        }

        # Tạo dữ liệu mẫu cho bảng Product
        self.stdout.write("Đang tạo sản phẩm...")
        product_list = []
        for category in categories:
            names = category_product_names.get(category.name, ["Generic Product"])
            chosen_names = set()
            for _ in range(10):  # Tạo 10 sản phẩm cho mỗi danh mục
                product_name = random.choice(names)
                while product_name in chosen_names:
                    product_name = random.choice(names)
                chosen_names.add(product_name)

                product = Product(
                    name=product_name,
                    price=round(random.uniform(10.0, 500.0), 2),
                    category=category,
                    image="https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5",
                    quantity=30  # Đặt số lượng cho mỗi sản phẩm là 30
                )
                product_list.append(product)

        # Bulk create sản phẩm để tối ưu hóa hiệu suất
        Product.objects.bulk_create(product_list)
        self.stdout.write(self.style.SUCCESS(f'Đã tạo {len(product_list)} sản phẩm.'))

        # Tạo giỏ hàng cho mỗi khách hàng
        self.stdout.write("Đang tạo giỏ hàng...")
        for customer in customers:
            Cart.objects.get_or_create(user=customer)

        self.stdout.write(self.style.SUCCESS(f'Đã tạo {len(customers)} giỏ hàng.'))

        # Chuẩn bị cho CartItems và Orders
        carts = list(Cart.objects.all())
        products = list(Product.objects.all())

        # Tạo dữ liệu mẫu cho CartItem
        seeder.add_entity(CartItem, 200, {
            "cart": lambda x: random.choice(carts),
            "product": lambda x: random.choice(products),
            "quantity": lambda x: random.randint(1, 5)
        })

        # Tạo dữ liệu mẫu cho Order
        seeder.add_entity(Order, 200, {
            "user": lambda x: random.choice(customers),
            "total_amount": lambda x: round(random.uniform(50.0, 1000.0), 2),
            "payment_status": lambda x: random.choice(["Paid", "Pending", "Failed"]),
            "shipping_address": lambda x: random.choice(["123 Main St", "456 Elm St", "789 Oak St", "321 Pine St", "654 Maple Ave"])
        })

        inserted_pks.update(seeder.execute())

        orders = list(Order.objects.all())

        # Tạo dữ liệu mẫu cho OrderDetail
        seeder.add_entity(OrderDetail, 200, {
            "order": lambda x: random.choice(orders),
            "product": lambda x: random.choice(products),
            "quantity": lambda x: random.randint(1, 3),
            "unit_price": lambda x: random.choice(products).price,
            "totalPrice": lambda x: random.choice(products).price * random.randint(1, 3)
        })

        # Tạo dữ liệu mẫu cho News
        seeder.add_entity(News, 200, {
            "title": lambda x: seeder.faker.sentence(),
            "content": lambda x: seeder.faker.paragraph(),
            "image": "https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5"
        })

        # Tạo dữ liệu mẫu cho Like
        seeder.add_entity(Like, 200, {
            "user": lambda x: random.choice(customers),
            "news": lambda x: random.choice(News.objects.all()),
        })

        inserted_pks.update(seeder.execute())

        self.stdout.write(self.style.SUCCESS('Cơ sở dữ liệu đã được gieo dữ liệu thành công với dữ liệu ban đầu cho Cửa Hàng Thời Trang.'))
