from rest_framework import serializers
from django.core.exceptions import ValidationError
from api.models import Product, Category, User, Customer, Staff
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
