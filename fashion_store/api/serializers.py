from rest_framework import serializers
from django.core.exceptions import ValidationError
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
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    def create(self, validated_data):
        data = validated_data.copy()

        user = User(**data)
        user.set_password(user.password)
        user.save()

        # Assign the correct permissions
        if data.get('is_staff'):
            staff_permission = Permission.objects.get(codename='staff')
            user.user_permissions.add(staff_permission)
        else:
            customer_permission = Permission.objects.get(codename='customer')
            user.user_permissions.add(customer_permission)

        return user

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise ValidationError("Email is already in use")
        return value

    def get_role(self, instance):
        if instance.has_perm('api.staff'):
            return "staff"
        if instance.has_perm('api.customer'):
            return "customer"

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
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = '__all__'

    def get_total_amount(self, obj):
        return obj.total_amount

class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    order_details = OrderDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'total_amount', 'created_at', 'updated_at', 'order_details']