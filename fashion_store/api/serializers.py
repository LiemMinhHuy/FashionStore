from rest_framework import serializers
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from api.models import Product, Category, User, Customer, Staff, Cart, CartItem, OrderDetail, Order
from django.contrib.auth.models import Permission

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image', 'quantity']  # List all relevant fields

class AuthenticatedProductDetailsSerializer(ProductSerializer):
    liked = serializers.SerializerMethodField()

    def get_liked(self, product):
        # Check if the user has liked this product
        return product.like_set.filter(user=self.context['request'].user, active=True).exists()

    class Meta:
        model = ProductSerializer.Meta.model
        # Explicitly list the fields including 'liked'
        fields = ProductSerializer.Meta.fields if ProductSerializer.Meta.fields != '__all__' else list(Product._meta.get_fields()) + ['liked']

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    def create(self, validated_data):
        data = validated_data.copy()

        # Lấy và loại bỏ password từ validated_data
        password = data.pop('password')

        # Tạo một Customer (kế thừa từ User)
        customer = Customer(**data)
        customer.set_password(password)  # Set the password
        customer.is_staff = False  # Set is_staff to False
        customer.save()  # Save the customer instance

        try:
            # Gán quyền 'customer' cho Customer
            customer_permission = Permission.objects.get(codename='customer')
            customer.user_permissions.add(customer_permission)
        except Permission.DoesNotExist:
            raise serializers.ValidationError({"permission": "Permission 'customer' không tồn tại."})

        return customer

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise ValidationError("Email is already in use")
        return value

    def get_role(self, instance):
        if instance.has_perm('api.customer'):
            return "customer"
        return "staff" if instance.is_staff else "regular"

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.avatar:
            rep['avatar'] = instance.avatar.url
        else:
            rep['avatar'] = 'https://res.cloudinary.com/ddoebyozj/image/upload/v1726042192/avartar_twah6s.jpg'
        return rep

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'password', 'avatar', 'role']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)  # Read-only product details
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),  # Ensure product is active
        source='product',  # This tells Django to use 'product' internally
        write_only=True  # We only need this field when writing (POST/PUT)
    )

    total_price = serializers.SerializerMethodField()  # To calculate the total price

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total_price']  # Fields for serialization

    def get_total_price(self, obj):
        # Ensure total price is calculated by multiplying price by quantity
        return obj.product.price * obj.quantity if obj.product else 0


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()  # Đặt tên đúng ở đây

    class Meta:
        model = Cart
        fields = '__all__'

    def get_total_amount(self, obj):
        return obj.total_amount

class OrderDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()  # Thêm trường product_name

    class Meta:
        model = OrderDetail
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'totalPrice', 'order', 'created_at', 'updated_at', 'is_active']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else 'Unknown Product'

class OrderSerializer(serializers.ModelSerializer):
    order_details = OrderDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'total_amount', 'created_at', 'updated_at', 'order_details']
