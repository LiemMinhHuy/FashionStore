from rest_framework import serializers
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from api.models import Product, Category, User, Customer, Staff, Cart, CartItem, OrderDetail, Order, Like, News, NewsComment, Address, ProductImage
from django.contrib.auth.models import Permission

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'thumbnail', 'quantity', 'description', 'images']


class AuthenticatedProductDetailsSerializer(ProductSerializer):
    liked = serializers.SerializerMethodField()

    def get_liked(self, product):
        # Check if the user has liked this product
        return product.like_set.filter(user=self.context['request'].user, active=True).exists()

    class Meta:
        model = ProductSerializer.Meta.model
        # Explicitly list the fields including 'liked'
        fields = ProductSerializer.Meta.fields if ProductSerializer.Meta.fields != '__all__' else list(Product._meta.get_fields()) + ['liked']

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'product', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

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
        # Ưu tiên: nếu tồn tại bản ghi Customer cho user này thì là 'customer'
        if Customer.objects.filter(id=instance.id).exists():
            return "customer"
        # Fallback theo quyền và is_staff
        if instance.has_perm('api.customer'):
            return "customer"
        return "staff" if instance.is_staff else "regular"

    def get_phone(self, instance):
        # Lấy Customer instance từ User instance
        try:
            customer = Customer.objects.get(id=instance.id)
            return customer.phone
        except Customer.DoesNotExist:
            return None

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.avatar:
            rep['avatar'] = instance.avatar.url
        else:
            rep['avatar'] = 'https://res.cloudinary.com/ddoebyozj/image/upload/v1757705018/fashion_store/avatar/avatar.jpg'
        return rep

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'password', 'avatar', 'role', 'phone']
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
    image = serializers.SerializerMethodField()  # Thêm trường image
    class Meta:
        model = OrderDetail
        fields = ['id', 'product', 'product_name', 'image', 'quantity', 'unit_price', 'totalPrice', 'order', 'created_at', 'updated_at', 'is_active']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else 'Unknown Product'
        
    def get_image(self, obj):
        import urllib.parse
        
        if obj.product and obj.product.image:
            image_url = None
            
            # Nếu là Cloudinary URL string
            if isinstance(obj.product.image, str):
                image_url = obj.product.image
            # Nếu là FileField/ImageField
            elif hasattr(obj.product.image, 'url'):
                image_url = obj.product.image.url

            if image_url:
                # Xử lý URL Cloudinary
                if 'cloudinary.com' in image_url:
                    # Xóa '/media/' prefix nếu có
                    image_url = image_url.replace('/media/', '')
                    # Decode URL
                    try:
                        # Tách URL thành các phần
                        parsed = urllib.parse.urlparse(image_url)
                        # Decode path
                        new_path = urllib.parse.unquote(parsed.path)
                        # Decode query parameters nếu có
                        new_query = urllib.parse.unquote(parsed.query) if parsed.query else ''
                        # Tái tạo URL với các phần đã decode
                        image_url = urllib.parse.urlunparse((
                            parsed.scheme,
                            parsed.netloc,
                            new_path,
                            parsed.params,
                            new_query,
                            parsed.fragment
                        ))
                        return image_url
                    except:
                        return image_url
                return image_url
            
            return str(obj.product.image)
        return None

class OrderSerializer(serializers.ModelSerializer):
    order_details = OrderDetailSerializer(many=True, read_only=True)
    customer = UserSerializer(source='user', read_only=True)  # Sử dụng source để lấy thông tin từ trường 'user'
    can_claim_points = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'total_amount', 'created_at', 'updated_at', 'order_details', 'customer', "status", 'points_earned', 'points_claimed']
    
    def get_can_claim_points(self, obj):
        return obj.can_claim_points()

class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = '__all__'

class NewsCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    news = serializers.PrimaryKeyRelatedField(read_only=True)
    parent_content = serializers.CharField(source='parent_comment.content', read_only=True) # Correct the source reference

    class Meta:
        model = NewsComment
        fields = ['id', 'news', 'user', 'content', 'parent_comment', 'created_at', 'parent_content']
        read_only_fields = ['id', 'news', 'user', 'created_at', 'parent_content']

class AddressSerializer(serializers.ModelSerializer):
    full_address = serializers.ReadOnlyField()
    short_address = serializers.ReadOnlyField()
    administrative_address = serializers.ReadOnlyField()

    class Meta:
        model = Address
        fields = [
            'id', 'full_name', 'phone', 'address_line1', 'address_line2',
            'province', 'district', 'ward', 'postal_code', 'country',
            'is_default', 'is_billing', 'is_shipping', 'note',
            'full_address', 'short_address', 'administrative_address',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        """Validate address data for Vietnam"""
        # Kiểm tra số điện thoại VN
        phone = data.get('phone', '')
        if phone and not phone.startswith('0') and not phone.startswith('+84'):
            raise serializers.ValidationError("Số điện thoại phải bắt đầu bằng 0 hoặc +84")

        # Kiểm tra mã bưu điện VN (6 số)
        postal_code = data.get('postal_code', '')
        if postal_code and (len(postal_code) != 6 or not postal_code.isdigit()):
            raise serializers.ValidationError("Mã bưu điện phải có 6 chữ số")

        return data

    def create(self, validated_data):
        """Tạo địa chỉ mới"""
        # Lấy Customer instance từ User hiện tại
        user = self.context['request'].user
        try:
            customer = Customer.objects.get(id=user.id)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("User is not a customer")
        
        validated_data['customer'] = customer

        # Nếu đây là địa chỉ đầu tiên, đặt làm mặc định
        if not Address.objects.filter(customer=customer).exists():
            validated_data['is_default'] = True

        return super().create(validated_data)

class CustomerAddressSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    default_address = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'point', 'addresses', 'default_address']

    def get_default_address(self, obj):
        default_addr = obj.addresses.filter(is_default=True).first()
        if default_addr:
            return AddressSerializer(default_addr).data
        return None