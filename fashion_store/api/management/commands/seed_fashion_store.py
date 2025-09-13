import random

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from api.models import User, Category, Product, ProductImage, Cart, Order, OrderDetail, Customer


# ===== Cấu hình dễ chỉnh sửa =====
DEFAULT_NUM_USERS = 10
DEFAULT_NUM_CUSTOMERS = 20
DEFAULT_PRODUCTS_PER_CATEGORY = 5
DEFAULT_NUM_ORDERS = 10
DEFAULT_PRODUCT_QUANTITY = 30
DEFAULT_EXTRA_IMAGES_PER_PRODUCT = 3

# Danh sách tên danh mục (có thể thêm/bớt dễ dàng)
CATEGORY_NAMES = [
    "T-Shirts", "Polo Shirts", "Shirts", "Vests", "Jeans", "Accessories"
]

# Cấu trúc sản phẩm cụ thể cho từng danh mục (tên, giá, mô tả, ảnh)
CATEGORY_PRODUCTS = {
    "T-Shirts": [
        {
            "name": "Cotton V-Neck Short Sleeve T-Shirt",
            "price": 29.99,
            "description": "Comfortable 100% cotton V-neck t-shirt with soft fabric and perfect fit. Ideal for everyday wear with a classic, timeless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product1/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product1/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product1/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product1/3.png"
            ]
        },
        {
            "name": "Cotton Embroidered V-Neck T-Shirt",
            "price": 39.99,
            "description": "Premium cotton t-shirt featuring elegant embroidered details and V-neck design. Perfect blend of comfort and style for any occasion.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product2/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product2/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product2/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product2/3.png"
            ]
        },
        {
            "name": "Simplicity Embroidered T-Shirt – Regular Fit",
            "price": 34.99,
            "description": "Clean and simple embroidered t-shirt with regular fit. Made from high-quality cotton for all-day comfort and effortless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product3/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product3/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product3/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product3/3.png"
            ]
        },
        {
            "name": "Cotton T-Shirt with Contrast Collar & Sleeve Trim",
            "price": 44.99,
            "description": "Stylish cotton t-shirt featuring contrast collar and sleeve trim details. A modern take on classic design with premium materials.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product4/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product4/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product4/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product4/3.png"
            ]
        },
        {
            "name": "Coffee Lovers Series 5 Embroidered Boxy T-Shirt",
            "price": 49.99,
            "description": "Special edition boxy fit t-shirt for coffee enthusiasts. Features unique embroidered design and relaxed fit for ultimate comfort.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product5/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product5/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product5/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product5/3.png"
            ]
        }
    ],
    "Polo Shirts": [
        {
            "name": "Knitted Polo Shirt – Short Sleeve, Navy/White Stripes",
            "price": 59.99,
            "description": "Elegant knitted polo shirt with classic navy and white stripes. Perfect for casual and semi-formal occasions with premium comfort.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product6/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product6/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product6/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product6/3.png"
            ]
        },
        {
            "name": "Colorblock Cotton Polo Shirt – Short Sleeve, Loose Fit",
            "price": 49.99,
            "description": "Modern colorblock polo shirt with loose fit design. Features bold color combinations and comfortable cotton fabric for relaxed style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product7/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product7/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product7/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product7/3.png"
            ]
        },
        {
            "name": "Patchwork Polo Shirt – Short Sleeve, Loose Fit",
            "price": 54.99,
            "description": "Unique patchwork polo shirt with artistic design elements. Loose fit ensures comfort while the patchwork pattern adds distinctive style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product8/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product8/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product8/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product8/3.png"
            ]
        },
        {
            "name": "Cotton Polo Shirt – Short Sleeve, Contrast Collar, Fitted",
            "price": 64.99,
            "description": "Classic fitted polo shirt with contrast collar design. Made from premium cotton with a tailored fit for a polished, professional look.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product9/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product9/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product9/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product9/3.png"
            ]
        },
        {
            "name": "Polo Shirt – Short Sleeve, Contrast Collar 'Together in Times",
            "price": 69.99,
            "description": "Special edition polo shirt with 'Together in Times' design and contrast collar. A meaningful piece that combines style with a positive message.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product10/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product10/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product10/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product10/3.png"
            ]
        }
    ],
    "Shirts": [
        {
            "name": "Oxford Short Sleeve Shirt – Plain, Relaxed Fit",
            "price": 79.99,
            "description": "Classic oxford cotton shirt with relaxed fit design. Perfect for casual and business casual occasions with timeless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product11/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product11/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product11/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product11/3.png"
            ]
        },
        {
            "name": "Cotton Long Sleeve Shirt – Chest Pocket with Embroidery",
            "price": 89.99,
            "description": "Elegant long sleeve cotton shirt featuring embroidered chest pocket detail. Perfect for professional and semi-formal settings.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product12/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product12/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product12/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product12/3.png"
            ]
        },
        {
            "name": "Cuban Denim Shirt – Short Sleeve, Loose Fit",
            "price": 94.99,
            "description": "Stylish Cuban-style denim shirt with loose fit design. Features classic Cuban collar and comfortable denim fabric for casual wear.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product13/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product13/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product13/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product13/3.png"
            ]
        },
        {
            "name": "Short Sleeve Shirt – Single Chest Pocket 'Friend Club",
            "price": 84.99,
            "description": "Casual short sleeve shirt with 'Friend Club' design and single chest pocket. Perfect for relaxed social gatherings and everyday wear.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product14/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product14/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product14/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product14/3.png"
            ]
        },
        {
            "name": "Blue Striped Shirt – Long Sleeve, Loose Fit",
            "price": 89.99,
            "description": "Classic blue striped long sleeve shirt with loose fit design. Timeless pattern perfect for both casual and business casual occasions.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product15/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product15/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product15/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product15/3.png"
            ]
        }
    ],
    "Vests": [
        {
            "name": "Wrap Blazer – Cross Front Design",
            "price": 199.99,
            "description": "Elegant wrap blazer with cross front design. Perfect for professional and formal occasions with a sophisticated, modern look.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product16/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product16/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product16/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product16/3.png"
            ]
        },
        {
            "name": "Linen Blazer – Fitted Style",
            "price": 149.99,
            "description": "Lightweight linen blazer with fitted silhouette. Perfect for warm weather and summer occasions with breathable comfort.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product17/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product17/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product17/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product17/3.png"
            ]
        },
        {
            "name": "Jacquard Blazer – Stitch Detail, Fitted",
            "price": 179.99,
            "description": "Luxurious jacquard blazer with intricate stitch details and fitted design. Features premium fabric and sophisticated craftsmanship.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product18/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product18/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product18/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product18/3.png"
            ]
        },
        {
            "name": "Black Blazer – Rayon Spandex, Fitted",
            "price": 159.99,
            "description": "Classic black blazer made from rayon spandex blend with fitted design. Offers comfort and flexibility while maintaining a professional appearance.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product19/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product19/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product19/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product19/3.png"
            ]
        },
        {
            "name": "Striped Blazer – Fitted Style",
            "price": 169.99,
            "description": "Elegant striped blazer with fitted silhouette. Features classic pinstripe pattern perfect for business and formal occasions.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product20/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product20/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product20/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product20/3.png"
            ]
        }
    ], 
    "Jeans": [
        {
            "name": "White Straight-Leg Jeans with Embroidered Back Pockets",
            "price": 29.99,
            "description": "Comfortable 100% cotton V-neck t-shirt with soft fabric and perfect fit. Ideal for everyday wear with a classic, timeless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product21/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product21/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product21/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product21/3.png"
            ]
        },
        {
            "name": "Straight-Leg Denim Jeans – Classic Straight Fit",
            "price": 39.99,
            "description": "Premium cotton t-shirt featuring elegant embroidered details and V-neck design. Perfect blend of comfort and style for any occasion.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product22/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product22/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product22/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product22/3.png"
            ]
        },
        {
            "name": "Straight-Leg Jeans – Classic Straight Fit Denim",
            "price": 34.99,
            "description": "Clean and simple embroidered t-shirt with regular fit. Made from high-quality cotton for all-day comfort and effortless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product23/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product23/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product223/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product3/3.png"
            ]
        },
        {
            "name": "Denim Jeans with Light Washed Faded Thigh Effect",
            "price": 44.99,
            "description": "Stylish cotton t-shirt featuring contrast collar and sleeve trim details. A modern take on classic design with premium materials.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product24/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product24/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product24/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product24/3.png"
            ]
        },
        {
            "name": "Straight-Leg Jeans – Classic Straight Fit Denim",
            "price": 49.99,
            "description": "Special edition boxy fit t-shirt for coffee enthusiasts. Features unique embroidered design and relaxed fit for ultimate comfort.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product25/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product25/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product25/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product25/3.png"
            ]
        }
    ],
    "Accessories": [
        {
            "name": "Embroidered Baseball Cap",
            "price": 29.99,
            "description": "Comfortable 100% cotton V-neck t-shirt with soft fabric and perfect fit. Ideal for everyday wear with a classic, timeless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product26/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product26/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product26/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product26/3.png"
            ]
        },
        {
            "name": "Two-Tone Embroidered Letter Baseball Cap",
            "price": 39.99,
            "description": "Premium cotton t-shirt featuring elegant embroidered details and V-neck design. Perfect blend of comfort and style for any occasion.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product27/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product27/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product27/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product27/3.png"
            ]
        },
        {
            "name": "Brewing Dream Baseball Cap – Adjustable Freesize",
            "price": 34.99,
            "description": "Clean and simple embroidered t-shirt with regular fit. Made from high-quality cotton for all-day comfort and effortless style.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product28/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product28/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product28/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product28/3.png"
            ]
        },
        {
            "name": "Coffee Lover Tote Bag – Eco-Friendly Canvas Bag",
            "price": 44.99,
            "description": "Stylish cotton t-shirt featuring contrast collar and sleeve trim details. A modern take on classic design with premium materials.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product29/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product29/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product29/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product29/3.png"
            ]
        },
        {
            "name": "Brewing Dream Baseball Cap – Adjustable Freesize",
            "price": 49.99,
            "description": "Special edition boxy fit t-shirt for coffee enthusiasts. Features unique embroidered design and relaxed fit for ultimate comfort.",
            "thumbnail": "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product30/thumbnail.png",
            "images": [
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product30/1.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525502/fashion_store/product30/2.png",
                "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525638/fashion_store/product30/3.png"
            ]
        }
    ]
}


def create_users(num_users: int) -> None:
    for i in range(num_users):
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


def create_customers(num_customers: int) -> None:
    for i in range(num_customers):
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


def create_categories() -> list:
    categories = []
    for name in CATEGORY_NAMES:
        category, _ = Category.objects.get_or_create(name=name)
        categories.append(category)
    return categories


def create_products(categories: list, products_per_category: int, default_quantity: int, use_structured: bool = True) -> list:
    product_list = []
    for category in categories:
        if use_structured and category.name in CATEGORY_PRODUCTS:
            # Sử dụng cấu trúc cụ thể
            products_data = CATEGORY_PRODUCTS[category.name]
            for product_data in products_data[:products_per_category]:
                product = Product(
                    name=product_data["name"],
                    price=product_data["price"],
                    category=category,
                    thumbnail=product_data["thumbnail"],
                    quantity=default_quantity,
                    description=product_data["description"]
                )
                product_list.append(product)
        else:
            # Fallback về random nếu không có cấu trúc hoặc use_structured=False
            names = ["Generic Product"]  # Fallback
            for _ in range(products_per_category):
                product_name = f"Generic {category.name} {_+1}"
                # Sử dụng ảnh mặc định
                thumbnail_url = "https://res.cloudinary.com/ddoebyozj/image/upload/v1757525582/fashion_store/product1/thumbnail.png"

                product = Product(
                    name=product_name,
                    price=round(random.uniform(10.0, 500.0), 2),
                    category=category,
                    thumbnail=thumbnail_url,
                    quantity=default_quantity,
                    description=f"Description for {product_name}"
                )
                product_list.append(product)

    # Lưu products vào database
    Product.objects.bulk_create(product_list)
    # Lấy lại products vừa tạo từ database dựa trên tên
    product_names = [p.name for p in product_list]
    saved_products = list(Product.objects.filter(name__in=product_names))
    return saved_products


def create_product_images(products: list, extra_images_per_product: int, use_structured: bool = True) -> int:
    """Tạo ảnh phụ cho các sản phẩm"""
    total_images = 0
    for product in products:
        if use_structured:
            # Tìm ảnh cụ thể cho sản phẩm này
            product_images = None
            for category_name, products_data in CATEGORY_PRODUCTS.items():
                for product_data in products_data:
                    if product_data["name"] == product.name:
                        product_images = product_data["images"]
                        break
                if product_images:
                    break
            
            if product_images:
                # Sử dụng ảnh cụ thể từ cấu trúc
                for image_url in product_images:
                    ProductImage.objects.create(
                        product=product,
                        image=image_url
                    )
                    total_images += 1
            else:
                # Fallback về random nếu không tìm thấy
                num_images = random.randint(1, extra_images_per_product)
                for i in range(num_images):
                    # Sử dụng ảnh mặc định đơn giản
                    image_url = f"https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product1/{i+1}.png"
                    ProductImage.objects.create(
                        product=product,
                        image=image_url
                    )
                    total_images += 1
        else:
            # Chế độ random
            num_images = random.randint(1, extra_images_per_product)
            for i in range(num_images):
                # Sử dụng ảnh mặc định đơn giản
                image_url = f"https://res.cloudinary.com/ddoebyozj/image/upload/v1757526014/fashion_store/product1/{i+1}.png"
                ProductImage.objects.create(
                    product=product,
                    image=image_url
                )
                total_images += 1
    return total_images


def ensure_carts_for_all_customers() -> int:
    customers = list(Customer.objects.all())
    for customer in customers:
        Cart.objects.get_or_create(user=customer)
    return len(customers)


def create_sample_orders(num_orders: int) -> None:
    customers = list(Customer.objects.all())
    products = list(Product.objects.all())
    for _ in range(num_orders):
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
        product = random.choice(products)
        quantity = random.randint(1, 3)
        OrderDetail.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            unit_price=product.price,
            totalPrice=product.price * quantity
        )


class Command(BaseCommand):
    help = "Gieo dữ liệu vào cơ sở dữ liệu với dữ liệu ban đầu cho việc kiểm tra và phát triển."

    def add_arguments(self, parser):
        parser.add_argument("--num-users", type=int, default=DEFAULT_NUM_USERS, help="Số lượng User (mặc định: 10)")
        parser.add_argument("--num-customers", type=int, default=DEFAULT_NUM_CUSTOMERS, help="Số lượng Customer (mặc định: 20)")
        parser.add_argument("--products-per-category", type=int, default=DEFAULT_PRODUCTS_PER_CATEGORY, help="Số sản phẩm mỗi danh mục (mặc định: 5)")
        parser.add_argument("--orders", type=int, default=DEFAULT_NUM_ORDERS, help="Số lượng đơn hàng mẫu (mặc định: 10)")
        parser.add_argument("--random-seed", type=int, default=None, help="Seed ngẫu nhiên để tái lập dữ liệu")
        parser.add_argument("--product-qty", type=int, default=DEFAULT_PRODUCT_QUANTITY, help="Số lượng tồn kho mặc định cho sản phẩm")
        parser.add_argument("--extra-images", type=int, default=DEFAULT_EXTRA_IMAGES_PER_PRODUCT, help="Số ảnh phụ tối đa cho mỗi sản phẩm (mặc định: 3)")
        parser.add_argument("--random-mode", action="store_true", help="Sử dụng chế độ random thay vì cấu trúc cụ thể")

    def handle(self, *args, **options):
        # Seed ngẫu nhiên nếu có
        if options.get("random_seed") is not None:
            random.seed(options["random_seed"])

        self.stdout.write("Đang tạo User và Customer...")
        create_users(options["num_users"])
        create_customers(options["num_customers"])
        self.stdout.write(self.style.SUCCESS("Đã tạo User và Customer."))

        self.stdout.write("Đang tạo danh mục...")
        categories = create_categories()
        self.stdout.write(self.style.SUCCESS(f"Đã tạo {len(categories)} danh mục."))

        use_structured = not options["random_mode"]
        mode_text = "cấu trúc cụ thể" if use_structured else "random"
        
        self.stdout.write(f"Đang tạo sản phẩm (chế độ {mode_text})...")
        products = create_products(
            categories,
            options["products_per_category"],
            options["product_qty"],
            use_structured
        )
        self.stdout.write(self.style.SUCCESS(f"Đã tạo {len(products)} sản phẩm."))

        self.stdout.write(f"Đang tạo ảnh cho sản phẩm (chế độ {mode_text})...")
        total_images = create_product_images(products, options["extra_images"], use_structured)
        self.stdout.write(self.style.SUCCESS(f"Đã tạo {total_images} ảnh phụ cho sản phẩm."))

        self.stdout.write("Đang tạo giỏ hàng...")
        total_carts = ensure_carts_for_all_customers()
        self.stdout.write(self.style.SUCCESS(f"Đã tạo {total_carts} giỏ hàng."))

        self.stdout.write("Đang tạo đơn hàng...")
        create_sample_orders(options["orders"])
        self.stdout.write(self.style.SUCCESS(f"Đã tạo {options['orders']} đơn hàng mẫu."))

        self.stdout.write(self.style.SUCCESS("Cơ sở dữ liệu đã được gieo dữ liệu thành công với dữ liệu ban đầu cho Cửa Hàng Thời Trang."))