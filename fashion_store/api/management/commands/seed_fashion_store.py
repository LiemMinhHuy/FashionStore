from datetime import datetime
import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from api.models import User, Category, Product, Cart, CartItem, Order, OrderDetail, News, Like, Customer

class Command(BaseCommand):
    help = "Gieo dữ liệu vào cơ sở dữ liệu với dữ liệu ban đầu cho việc kiểm tra và phát triển."

    def handle(self, *args, **options):
        # Tạo một số User và Customer đơn giản
        self.stdout.write("Đang tạo User và Customer...")
        
        # Tạo 10 User
        for i in range(10):
            User.objects.get_or_create(
                username=f"user{i+1}",
                defaults={
                    "email": f"user{i+1}@example.com",
                    "first_name": f"User{i+1}",
                    "last_name": "Test",
                    "password": make_password("password123"),
                    "is_staff": False,
                }
            )
        
        # Tạo 20 Customer
        for i in range(20):
            Customer.objects.get_or_create(
                username=f"customer{i+1}",
                defaults={
                    "email": f"customer{i+1}@example.com",
                    "first_name": f"Customer{i+1}",
                    "last_name": "Test",
                    "password": make_password("password123"),
                    "phone": f"012345678{i}",
                    "point": 0,
                }
            )
        
        self.stdout.write(self.style.SUCCESS('Đã tạo User và Customer.'))

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
            for _ in range(5):  # Tạo 5 sản phẩm cho mỗi danh mục
                product_name = random.choice(names)
                while product_name in chosen_names:
                    product_name = random.choice(names)
                chosen_names.add(product_name)

                product = Product(
                    name=product_name,
                    price=round(random.uniform(10.0, 500.0), 2),
                    category=category,
                    image="https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5",
                    quantity=30,
                    description=f"Description for {product_name}"
                )
                product_list.append(product)

        # Bulk create sản phẩm để tối ưu hóa hiệu suất
        Product.objects.bulk_create(product_list)
        self.stdout.write(self.style.SUCCESS(f'Đã tạo {len(product_list)} sản phẩm.'))

        # Tạo giỏ hàng cho mỗi khách hàng
        self.stdout.write("Đang tạo giỏ hàng...")
        customers = list(Customer.objects.all())
        for customer in customers:
            Cart.objects.get_or_create(user=customer)

        self.stdout.write(self.style.SUCCESS(f'Đã tạo {len(customers)} giỏ hàng.'))

        # Tạo một số đơn hàng mẫu
        self.stdout.write("Đang tạo đơn hàng...")
        products = list(Product.objects.all())
        
        # Tạo 10 đơn hàng mẫu
        for i in range(10):
            customer = random.choice(customers)
            total_amount = round(random.uniform(50.0, 1000.0), 2)
            
            order = Order.objects.create(
                user=customer,
                total_amount=total_amount,
                payment_status=random.choice(["Paid", "Pending", "Failed"]),
                status=random.choice(["Completed", "Processing", "Pending"]),
                payment_method=random.choice(["Cash", "PayPal", "VNPay"]),
                points_earned=int(total_amount / 10) if total_amount >= 10 else 0,
                points_claimed=False
            )
            
            # Tạo OrderDetail cho đơn hàng
            product = random.choice(products)
            quantity = random.randint(1, 3)
            OrderDetail.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=product.price,
                totalPrice=product.price * quantity
            )

        self.stdout.write(self.style.SUCCESS('Đã tạo 10 đơn hàng mẫu.'))

        self.stdout.write(self.style.SUCCESS('Cơ sở dữ liệu đã được gieo dữ liệu thành công với dữ liệu ban đầu cho Cửa Hàng Thời Trang.'))
