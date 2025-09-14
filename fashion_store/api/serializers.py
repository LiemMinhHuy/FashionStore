from rest_framework import serializers
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from api.models import Product, Category, User, Customer, Staff, Cart, CartItem, OrderDetail, Order, Like, News, NewsComment, Address, ProductImage, Coupon, CustomerCoupon, CouponUsage
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
    thumbnail = serializers.SerializerMethodField()  # Thêm trường image
    class Meta:
        model = OrderDetail
        fields = ['id', 'product', 'product_name', 'thumbnail', 'quantity', 'unit_price', 'totalPrice', 'order', 'created_at', 'updated_at', 'is_active']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else 'Unknown Product'
        
    def get_thumbnail(self, obj):
        import urllib.parse
        
        if obj.product and obj.product.thumbnail:
            image_url = None
            
            # Nếu là Cloudinary URL string
            if isinstance(obj.product.thumbnail, str):
                image_url = obj.product.thumbnail
            # Nếu là FileField/ImageField
            elif hasattr(obj.product.thumbnail, 'url'):
                image_url = obj.product.thumbnail.url

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
            
            # Fallback to string representation
            return str(obj.product.thumbnail)
        return None

class OrderSerializer(serializers.ModelSerializer):
    order_details = OrderDetailSerializer(many=True, read_only=True)
    customer = UserSerializer(source='user', read_only=True)  # Sử dụng source để lấy thông tin từ trường 'user'
    can_claim_points = serializers.SerializerMethodField()
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    coupon_name = serializers.CharField(source='coupon.name', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = [
            'user', 'total_amount', 'original_amount', 'discount_amount', 
            'created_at', 'updated_at', 'order_details', 'customer', 
            'status', 'points_earned', 'points_claimed', 'coupon_code', 'coupon_name'
        ]
    
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


# Coupon Serializers
class CouponSerializer(serializers.ModelSerializer):
    """Serializer for Coupon model"""
    is_valid = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    usage_remaining = serializers.ReadOnlyField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'name', 'description', 'discount_type', 'discount_value',
            'max_discount_amount', 'min_order_amount', 'usage_limit', 'usage_limit_per_customer',
            'valid_from', 'valid_until', 'coupon_type', 'is_active', 'used_count',
            'is_valid', 'is_expired', 'usage_remaining', 'created_at', 'updated_at'
        ]
        read_only_fields = ['used_count', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate coupon data"""
        # Check date validity
        if data.get('valid_from') and data.get('valid_until'):
            if data['valid_from'] >= data['valid_until']:
                raise serializers.ValidationError("Valid from date must be before valid until date")
        
        # Check discount value based on type
        discount_type = data.get('discount_type')
        discount_value = data.get('discount_value')
        
        if discount_type == 'percentage' and discount_value:
            if discount_value < 0 or discount_value > 100:
                raise serializers.ValidationError("Percentage discount must be between 0 and 100")
        
        if discount_type == 'fixed_amount' and discount_value and discount_value < 0:
            raise serializers.ValidationError("Fixed amount discount must be positive")
        
        return data


class CouponUsageSerializer(serializers.ModelSerializer):
    """Serializer for CouponUsage model"""
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    coupon_name = serializers.CharField(source='coupon.name', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    
    class Meta:
        model = CouponUsage
        fields = [
            'id', 'coupon', 'coupon_code', 'coupon_name', 'customer', 'customer_name',
            'order', 'order_amount', 'discount_amount', 'used_at'
        ]
        read_only_fields = ['used_at']


class CustomerCouponSerializer(serializers.ModelSerializer):
    """Serializer for CustomerCoupon model"""
    coupon = CouponSerializer(read_only=True)
    coupon_id = serializers.PrimaryKeyRelatedField(
        queryset=Coupon.objects.filter(is_active=True),
        source='coupon',
        write_only=True
    )
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    
    class Meta:
        model = CustomerCoupon
        fields = [
            'id', 'customer', 'customer_name', 'coupon', 'coupon_id', 
            'assigned_by', 'assigned_by_name', 'assigned_at'
        ]
        read_only_fields = ['assigned_at']


class CouponValidationSerializer(serializers.Serializer):
    """Serializer for coupon validation requests"""
    code = serializers.CharField(max_length=50)
    order_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    
    def validate_code(self, value):
        """Validate that the coupon code exists"""
        try:
            coupon = Coupon.objects.get(code=value.upper())
            if not coupon.is_active:
                raise serializers.ValidationError("This coupon is not active")
            return value.upper()
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code")


class ApplyCouponSerializer(serializers.Serializer):
    """Serializer for applying coupon to order"""
    code = serializers.CharField(max_length=50)
    
    def validate_code(self, value):
        """Validate that the coupon code exists and is active"""
        try:
            coupon = Coupon.objects.get(code=value.upper(), is_active=True)
            return value.upper()
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive coupon code")


class CustomerAvailableCouponsSerializer(serializers.ModelSerializer):
    """Serializer for coupons available to a specific customer"""
    can_use = serializers.SerializerMethodField()
    discount_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'name', 'description', 'discount_type', 'discount_value',
            'max_discount_amount', 'min_order_amount', 'valid_until', 'can_use', 'discount_preview'
        ]
    
    def get_can_use(self, obj):
        """Check if customer can use this coupon"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                customer = Customer.objects.get(id=request.user.id)
                can_use, message = obj.can_be_used_by_customer(customer)
                return {'can_use': can_use, 'message': message}
            except Customer.DoesNotExist:
                return {'can_use': False, 'message': 'User is not a customer'}
        return {'can_use': False, 'message': 'Authentication required'}
    
    def get_discount_preview(self, obj):
        """Get discount preview for different order amounts"""
        previews = []
        sample_amounts = [100000, 200000, 500000, 1000000]  # Sample amounts in VND
        
        for amount in sample_amounts:
            if amount >= obj.min_order_amount:
                discount = obj.calculate_discount(amount)
                previews.append({
                    'order_amount': amount,
                    'discount_amount': discount,
                    'final_amount': amount - discount
                })
        
        return previews