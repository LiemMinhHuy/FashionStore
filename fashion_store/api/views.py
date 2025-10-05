import json
import logging
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
from urllib.parse import urlencode

import paypalrestsdk
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.exceptions import ValidationError
from django.db import models
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from oauth2_provider.models import AccessToken, Application, RefreshToken
from rest_framework import generics, status, viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password

from api import serializers, paginators
from api.models import (
    Product, Category, User, Cart, CartItem, Order, OrderDetail, 
    Customer, Like, News, NewsComment, NewsCategory, Address, Coupon, CustomerCoupon, CouponUsage, PasswordResetToken
)

logger = logging.getLogger(__name__)

# ========================
# PAYPAL CONFIG HELPER
# ========================
def configure_paypal():
    """Cấu hình PayPal SDK theo settings."""
    paypalrestsdk.configure({
        "mode": settings.PAYPAL_MODE,
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET
    })

# ========================
# CATEGORY VIEWS
# ========================
class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    """ViewSet quản lý danh mục sản phẩm."""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = serializers.CategorySerializer
    pagination_class = paginators.Category

    @action(methods=['get'], detail=False, url_path='count')
    def get_total_categories(self, request):
        total_categories = Category.objects.count()
        return Response({'total': total_categories})

    @action(methods=['post'], url_path='admin/product', detail=False)
    def post_product(self, request, pk=None):
        """Tạo sản phẩm mới bởi admin."""
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

        p = Product.objects.create(
            name=request.data.get('name'),
            price=request.data.get('price'),
            image=request.data.get('image'),
            category=category
        )
        return Response(serializers.ProductSerializer(p).data, status=status.HTTP_201_CREATED)

# ========================
# PRODUCT VIEWS
# ========================
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
    """ViewSet quản lý các thao tác liên quan đến sản phẩm."""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = serializers.ProductSerializer
    pagination_class = paginators.ProductPaginator

    def get_permissions(self):
        if self.action in ['like']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).order_by('-created_at')
        if self.action == 'list':
            q = self.request.query_params.get('q')
            if q:
                queryset = queryset.filter(name__icontains=q)
            category_id = self.request.query_params.get('category_id')
            if category_id:
                queryset = queryset.filter(category_id=category_id)
            sort_option = self.request.query_params.get('sort_option', self.request.query_params.get('sortOption', 'latest'))
            if sort_option == 'latest':
                queryset = queryset.order_by('-created_at')
            elif sort_option == 'oldest':
                queryset = queryset.order_by('created_at')
            elif sort_option == 'price_desc':
                queryset = queryset.order_by('-price', '-created_at')
            elif sort_option == 'price_asc':
                queryset = queryset.order_by('price')
        return queryset

    @action(methods=['get'], detail=False, url_path='count')
    def get_total_categories(self, request):
        total_product = Product.objects.count()
        return Response({'total': total_product})

    @action(methods=['get'], url_path='product-detail', detail=True)
    def get_product_detail(self,request, pk=True):
        try:
            product = Product.objects.get(pk=pk,is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializers.ProductSerializer(product).data, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=False, url_path='category/(?P<category_id>[^/.]+)')
    def products_by_category(self, request, category_id=None):
        try:
            category = Category.objects.get(pk=category_id, is_active=True)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        products = Product.objects.filter(category=category, is_active=True)

        # Apply optional search
        q = request.query_params.get('q')
        if q:
            products = products.filter(name__icontains=q)

        # Apply sorting similar to list endpoint
        sort_option = request.query_params.get('sort_option', request.query_params.get('sortOption', 'latest'))
        if sort_option == 'latest':
            products = products.order_by('-created_at')
        elif sort_option == 'oldest':
            products = products.order_by('created_at')
        elif sort_option == 'price_desc':
            products = products.order_by('-price', '-created_at')
        elif sort_option == 'price_asc':
            products = products.order_by('price')
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_paginated_response(serializers.ProductSerializer(page, many=True).data)
        else:
            serializer = serializers.ProductSerializer(products, many=True)
        logger.debug(f"Paginated response for category {category_id}: {serializer.data}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=True, url_path='delete')
    def delete_product(self, request, pk=None):
        try:
            product = Product.objects.get(pk=pk)
            if product.is_active:
                product.is_active = False
                product.save()
                return Response({'message': 'Product deactivated successfully.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Product already inactive.'}, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['patch'], url_path='admin/product', detail=True)
    def update_product(self, request, pk=None):
        product = self.get_object()
        serializer = serializers.ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=['post'], detail=True, url_path='like')
    def like(self, request, pk=None):
        product = self.get_object()
        like, created = Like.objects.get_or_create(product=product, user=request.user)
        if not created:
            like.active = not like.active
            like.save()
        return Response(serializers.AuthenticatedProductDetailsSerializer(product).data, status=status.HTTP_200_OK)

# ========================
# USER VIEWS
# ========================
class UserViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView, generics.ListCreateAPIView):
    """ViewSet quản lý người dùng."""
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    pagination_class = paginators.UserPaginator

    def get_permissions(self):
        if self.action in ['partial_update']:
            return [permissions.UserOwnerPermission(), ]
        elif self.action in ['create']:
            return [permissions.AllowAny(), ]
        return [permissions.AllowAny(), ]

    @action(methods=['get'], detail=False, url_path='count')
    def get_total_user(self, request):
        total_user = User.objects.count()
        return Response({'total': total_user})

    @action(methods=['get', 'patch'], url_path='current-user', detail=False)
    def get_current_user(self, request):
        user = request.user
        if request.method == 'PATCH':
            # Update user fields
            user_fields = ['first_name', 'last_name', 'email', 'avatar']
            for field in user_fields:
                if field in request.data:
                    setattr(user, field, request.data[field])
                elif field in request.FILES:
                    setattr(user, field, request.FILES[field])
            user.save()
            
            # Update customer phone if user is a customer
            try:
                customer = Customer.objects.get(id=user.id)
                if 'phone' in request.data:
                    customer.phone = request.data['phone']
                    customer.save()
            except Customer.DoesNotExist:
                pass
    
        return Response(self.get_serializer(user).data)
    



# ========================
# PASSWORD RESET VIEWS
# ========================

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Gửi mã xác thực 6 số qua email"""
    try:
        email = request.data.get('email')
        if not email:
            return Response({
                'error': 'Email is required',
                'message': 'Vui lòng nhập email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Tìm user theo email
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({
                'error': 'Email not found',
                'message': 'Email không tồn tại trong hệ thống'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Vô hiệu hóa các token cũ
        PasswordResetToken.objects.filter(
            user=user, 
            is_used=False
        ).update(is_used=True)
        
        # Tạo token mới
        reset_token = PasswordResetToken.objects.create(
            user=user,
            email=email
        )
        
        # Gửi email
        subject = 'Mã xác thực đặt lại mật khẩu - Fashion Store'
        message = f"""
        Xin chào {user.first_name or user.username},
        
        Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Fashion Store.
        
        Mã xác thực của bạn là: {reset_token.token}
        
        Mã này có hiệu lực trong 10 phút.
        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        
        Trân trọng,
        Fashion Store Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': 'Mã xác thực đã được gửi đến email của bạn',
                'token_id': reset_token.id  # Để frontend track
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return Response({
                'error': 'Email sending failed',
                'message': 'Không thể gửi email. Vui lòng thử lại sau.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return Response({
            'error': 'Internal server error',
            'message': 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """Xác thực mã 6 số"""
    try:
        email = request.data.get('email')
        token = request.data.get('token')
        
        if not email or not token:
            return Response({
                'error': 'Email and token are required',
                'message': 'Vui lòng nhập email và mã xác thực'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Tìm token hợp lệ
        try:
            reset_token = PasswordResetToken.objects.get(
                email=email,
                token=token,
                is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Invalid token',
                'message': 'Mã xác thực không hợp lệ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra token có hợp lệ không
        if not reset_token.is_valid():
            return Response({
                'error': 'Token expired or too many attempts',
                'message': 'Mã xác thực đã hết hạn hoặc bạn đã thử quá nhiều lần'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': 'Mã xác thực hợp lệ',
            'token_id': reset_token.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Verify token error: {e}")
        return Response({
            'error': 'Internal server error',
            'message': 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Đặt lại mật khẩu mới"""
    try:
        email = request.data.get('email')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([email, token, new_password, confirm_password]):
            return Response({
                'error': 'All fields are required',
                'message': 'Vui lòng điền đầy đủ thông tin'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match',
                'message': 'Mật khẩu xác nhận không khớp'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({
                'error': 'Password too short',
                'message': 'Mật khẩu phải có ít nhất 6 ký tự'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Tìm token hợp lệ
        try:
            reset_token = PasswordResetToken.objects.get(
                email=email,
                token=token,
                is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response({
                'error': 'Invalid token',
                'message': 'Mã xác thực không hợp lệ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra token có hợp lệ không
        if not reset_token.is_valid():
            return Response({
                'error': 'Token expired or too many attempts',
                'message': 'Mã xác thực đã hết hạn hoặc bạn đã thử quá nhiều lần'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật mật khẩu
        user = reset_token.user
        user.password = make_password(new_password)
        user.save()
        
        # Đánh dấu token đã sử dụng
        reset_token.mark_as_used()
        
        return Response({
            'success': True,
            'message': 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        return Response({
            'error': 'Internal server error',
            'message': 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    """User login API."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return JsonResponse({'error': 'Username và password là bắt buộc'}, status=400)
        
        TOKEN_URL = 'http://127.0.0.1:8000/o/token/'
        response = requests.post(TOKEN_URL, data={
            'grant_type': 'password',
            'username': username,
            'password': password,
            'client_id': settings.CLIENT_ID,
            'client_secret': settings.CLIENT_SECRET
        }, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            return JsonResponse({
                'access_token': token_data.get('access_token'),
                'refresh_token': token_data.get('refresh_token'),
                'expires_in': token_data.get('expires_in')
            }, status=200)
        else:
            logger.error("Token request failed: %s", response.json())
            return JsonResponse(response.json(), status=response.status_code)

# ========================
# CART VIEWS
# ========================
class CartViewSet(viewsets.ViewSet):
    """ViewSet quản lý giỏ hàng."""
    serializer_class = serializers.CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Cart.objects.all()

    def get_object(self):
        customer = get_object_or_404(Customer, id=self.request.user.id)
        cart, created = Cart.objects.get_or_create(user=customer)
        return cart

    def retrieve(self, request):
        cart = self.get_object()
        serializer = self.serializer_class(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['post'], detail=False, url_path='add-cart')
    def add_to_cart(self, request):
        cart_items_data = request.data.get('items', [])
        cart = self.get_object()
        cart_items = []
        for item_data in cart_items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity')
            if quantity is None or quantity <= 0:
                return Response({'detail': 'Số lượng phải lớn hơn không'}, status=status.HTTP_400_BAD_REQUEST)
            product = get_object_or_404(Product, id=product_id)
            if product.quantity < quantity:
                return Response({'detail': f'Không đủ hàng cho sản phẩm {product_id}'}, status=status.HTTP_400_BAD_REQUEST)
            cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': quantity})
            if not created:
                cart_item.quantity += quantity
            cart_item.save()
            cart_items.append(cart_item.id)
        return Response({'detail': 'Sản phẩm đã được thêm vào giỏ hàng', 'cart_items': cart_items}, status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=False, url_path='remove/(?P<cart_item_id>[^/.]+)')
    def remove_cart(self, request, cart_item_id=None):
        cart = self.get_object()
        cart_item = get_object_or_404(CartItem, cart=cart, id=cart_item_id)
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=['patch'], detail=False, url_path='update-cart-item/(?P<cart_item_id>[^/.]+)')
    def update_cart_item(self, request, cart_item_id=None):
        cart = self.get_object()
        cart_item = get_object_or_404(CartItem, cart=cart, id=cart_item_id)
        quantity = request.data.get('quantity')
        if quantity is None or quantity <= 0:
            return Response({'detail': 'Số lượng phải lớn hơn không'}, status=status.HTTP_400_BAD_REQUEST)
        if cart_item.product.quantity < quantity:
            return Response({'detail': 'Không đủ hàng'}, status=status.HTTP_400_BAD_REQUEST)
        cart_item.quantity = quantity
        cart_item.save()
        return Response({'detail': 'Số lượng sản phẩm đã được cập nhật', 'quantity': cart_item.quantity}, status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=False, url_path='clear')
    def clear_cart(self, request):
        """Xóa tất cả sản phẩm trong giỏ hàng."""
        cart = self.get_object()
        CartItem.objects.filter(cart=cart).delete()
        return Response({'detail': 'Giỏ hàng đã được xóa'}, status=status.HTTP_200_OK)

# ========================
# ORDER VIEWS
# ========================
class OrderViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    """ViewSet quản lý đơn hàng."""
    queryset = Order.objects.filter(is_active=True)
    serializer_class = serializers.OrderSerializer
    pagination_class = paginators.OrderPaginator

    def get_permissions(self):
        if self.action in ['user_orders','checkout']:
            return [permissions.IsAuthenticated(), ]
        elif self.action in ['create']:
            return [permissions.AllowAny(), ]
        return [permissions.AllowAny(), ]

    def get_queryset(self):
        queryset = Order.objects.all()
        
        # Tìm kiếm theo Order ID
        order_id = self.request.query_params.get('order_id')
        if order_id:
            try:
                # Chuyển đổi order_id thành số nguyên để tìm kiếm chính xác
                order_id_int = int(order_id)
                queryset = queryset.filter(id=order_id_int)
            except ValueError:
                # Nếu order_id không phải là số, trả về queryset rỗng
                queryset = queryset.none()
        
        # Tìm kiếm theo tên sản phẩm (nếu cần)
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(orderdetail__product__name__icontains=q).distinct()
        
        # Lọc theo status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Lọc theo payment method
        payment_method = self.request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Lọc theo khoảng thời gian
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                # Chuyển đổi start_date thành datetime và set thời gian là 00:00:00
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                start_datetime = timezone.make_aware(start_datetime.replace(hour=0, minute=0, second=0, microsecond=0))
                queryset = queryset.filter(created_at__gte=start_datetime)
            except ValueError:
                # Nếu format date không đúng, bỏ qua filter này
                pass
        
        if end_date:
            try:
                # Chuyển đổi end_date thành datetime và set thời gian là 23:59:59
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = timezone.make_aware(end_datetime.replace(hour=23, minute=59, second=59, microsecond=999999))
                queryset = queryset.filter(created_at__lte=end_datetime)
            except ValueError:
                # Nếu format date không đúng, bỏ qua filter này
                pass
        
        # Sắp xếp theo thời gian
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        else:
            # Mặc định sắp xếp theo mới nhất
            queryset = queryset.order_by('-created_at')
        
        # Lọc theo user nếu đã đăng nhập
        user = self.request.user
        if user.is_authenticated:
            return queryset.filter(user=user)
        else:
            return queryset.filter(is_active=True)


    @action(methods=['get'], detail=False, url_path='user-orders')
    def user_orders(self, request):
        # Sử dụng get_queryset() để áp dụng logic tìm kiếm và filter
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(methods=['get'], detail=False, url_path='order-detail/(?P<order_id>[^/.]+)')
    def get_order_detail(self, request, order_id=None):
        try:
            # Lấy order specific theo order_id
            order = Order.objects.get(id=order_id)
            
            # Kiểm tra quyền truy cập (chỉ cho phép user xem order của họ)
            if request.user.is_authenticated and order.user.id != request.user.id:
                return Response(
                    {'error': 'You do not have permission to view this order'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Sử dụng serializer với depth=1 để lấy thêm thông tin chi tiết
            serializer = self.get_serializer(order, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(methods=['post'], detail=False, url_path='checkout')
    def checkout(self, request):
        user = request.user
        try:
            customer = Customer.objects.get(username=user.username)
        except Customer.DoesNotExist:
            return Response({'error': 'Người dùng không phải là khách hàng'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate and resolve shipping address as Address instance
        shipping_address_id = request.data.get('shipping_address_id') or request.data.get('shippingAddressId')
        shipping_address_str = request.data.get('shipping_address')
        payment_method = request.data.get('payment_method', 'Cash')
        coupon_code = request.data.get('coupon_code')  # New: coupon support
        
        if payment_method not in [choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]:
            return Response({'error': 'Phương thức thanh toán không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
        
        cart = Cart.objects.filter(user=customer).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Giỏ hàng không tồn tại hoặc trống'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate original total amount
        original_total_amount = sum(item.product.price * item.quantity for item in cart.items.all())
        total_amount = original_total_amount
        discount_amount = Decimal('0')
        applied_coupon = None
        
        # Apply coupon if provided
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code.upper(), is_active=True)
                can_use, message = coupon.can_be_used_by_customer(customer, original_total_amount)
                
                if can_use:
                    discount_amount = coupon.calculate_discount(original_total_amount)
                    total_amount = original_total_amount - discount_amount
                    applied_coupon = coupon
                else:
                    return Response({
                        'error': f'Cannot use coupon: {message}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except Coupon.DoesNotExist:
                return Response({
                    'error': 'Invalid coupon code'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        order_status = "Processing" if payment_method == "Cash" else "Pending"
        
        # Resolve Address
        shipping_address_obj = None
        if shipping_address_id:
            try:
                shipping_address_obj = Address.objects.get(id=shipping_address_id, customer=customer)
            except Address.DoesNotExist:
                return Response({'error': 'Địa chỉ giao hàng không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # If FE sent a string, fallback to default shipping address
            if shipping_address_str:
                shipping_address_obj = Address.objects.filter(customer=customer, is_shipping=True).order_by('-is_default', '-created_at').first()
            else:
                shipping_address_obj = Address.objects.filter(customer=customer, is_shipping=True).order_by('-is_default', '-created_at').first()
            if not shipping_address_obj:
                return Response({'error': 'Thiếu địa chỉ giao hàng. Vui lòng chọn hoặc tạo địa chỉ.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create order with coupon information
        order = Order.objects.create(
            user=customer,
            total_amount=total_amount,
            original_amount=original_total_amount,
            discount_amount=discount_amount,
            coupon=applied_coupon,
            payment_method=payment_method,
            shipping_address=shipping_address_obj,
            created_at=timezone.localtime(),
            status=order_status
        )
        
        # Calculate and set points earned for this order
        order.points_earned = order.calculate_points()
        order.save()
        
        # Create order details
        for item in cart.items.all():
            OrderDetail.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.product.price
            )
        
        # Apply coupon usage if coupon was used
        if applied_coupon:
            try:
                # Create coupon usage record and update coupon usage count
                CouponUsage.objects.create(
                    coupon=applied_coupon,
                    customer=customer,
                    order=order,
                    order_amount=original_total_amount,
                    discount_amount=discount_amount
                )
                
                # Update coupon usage count
                applied_coupon.used_count += 1
                applied_coupon.save()
                
            except Exception as e:
                # If coupon application fails, we should rollback the order
                order.delete()
                return Response({
                    'error': f'Failed to apply coupon: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Xử lý thanh toán PayPal
        if payment_method == 'PayPal':
            configure_paypal()
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": "http://localhost:3000/payment-success",
                    "cancel_url": "http://127.0.0.1:8000/payment-failed"
                },
                "transactions": [{
                    "amount": {"total": str(total_amount), "currency": "USD"},
                    "description": f"Order #{order.id}"
                }]
            })
            if payment.create():
                order.payment_id = payment.id
                order.status = 'Pending'
                order.save()
                payment_url = next(link.href for link in payment.links if link.rel == "approval_url")
                return Response({
                    'payment_url': payment_url,
                    'order': serializers.OrderSerializer(order).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Lỗi khi tạo thanh toán PayPal'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear cart after successful order creation
        cart.items.all().delete()
        
        # Return order details with coupon information
        response_data = serializers.OrderSerializer(order).data
        if applied_coupon:
            response_data['coupon_applied'] = {
                'code': applied_coupon.code,
                'name': applied_coupon.name,
                'discount_amount': discount_amount,
                'original_amount': original_total_amount,
                'final_amount': total_amount
            }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], detail=False, url_path='count')
    def get_total_orders(self, request):
        total_order = Product.objects.count()
        return Response({'total': total_order})

    @action(methods=['post'], detail=False, url_path='get-by-payment-id')
    def get_by_payment_id(self, request):
        """Lấy thông tin đơn hàng theo payment ID."""
        payment_id = request.data.get('payment_id')
        if not payment_id:
            return Response({'error': 'Payment ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = Order.objects.get(payment_id=payment_id)
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['post'], detail=True, url_path='claim-points')
    def claim_points(self, request, pk=None):
        """Customer claim points for a completed order."""
        try:
            order = self.get_object()
            
            # Kiểm tra quyền truy cập
            if request.user.id != order.user.id:
                return Response({'error': 'You can only claim points for your own orders'}, 
                              status=status.HTTP_403_FORBIDDEN)
            
            # Tính điểm nếu chưa được tính
            if order.points_earned == 0:
                order.points_earned = order.calculate_points()
                order.save()
            
            # Claim points
            if order.claim_points():
                return Response({
                    'message': f'Successfully claimed {order.points_earned} points!',
                    'points_earned': order.points_earned,
                    'total_points': order.user.point
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Cannot claim points for this order. Order must be completed and points not already claimed.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

# ========================
# PAYMENT VIEWS
# ========================
class ExecutePaypalPaymentView(APIView):
    """API thực thi thanh toán PayPal."""
    def post(self, request):
        payment_id = request.data.get('payment_id')
        payer_id = request.data.get('payer_id')
        if not payment_id or not payer_id:
            logger.warning("[PayPal] Thiếu payment_id hoặc payer_id.")
            return Response({'error': 'Missing payment_id or payer_id'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Kiểm tra trạng thái đơn hàng trước khi gọi PayPal
            try:
                order = Order.objects.get(payment_id=payment_id)
                if order.payment_status == 'Paid' or order.status == 'Processing':
                    logger.info(f"[PayPal] Payment already executed for order {order.id}")
                    return Response({'message': 'Payment already executed'}, status=status.HTTP_200_OK)
            except Order.DoesNotExist:
                order = None
            logger.info(f"[PayPal] Đang tìm payment với ID: {payment_id}")
            payment = paypalrestsdk.Payment.find(payment_id)
            if payment.execute({"payer_id": payer_id}):
                logger.info(f"[PayPal] Payment executed thành công: {payment.id}")
                try:
                    if not order:
                        order = Order.objects.get(payment_id=payment_id)
                    order.payment_status = 'Paid'
                    order.status = 'Processing'
                    order.save()
                    logger.info(f"[Order] Cập nhật thành công đơn hàng {order.id}")
                    return Response({'message': 'Payment executed successfully'}, status=status.HTTP_200_OK)
                except Order.DoesNotExist:
                    logger.error(f"[Order] Không tìm thấy đơn hàng với payment_id: {payment_id}")
                    return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                error_info = payment.error
                # Nếu lỗi là PAYMENT_ALREADY_DONE thì cũng trả về thành công
                if error_info and error_info.get('name') == 'PAYMENT_ALREADY_DONE':
                    logger.info(f"[PayPal] PAYMENT_ALREADY_DONE cho payment_id={payment_id}")
                    return Response({'message': 'Payment already executed'}, status=status.HTTP_200_OK)
                logger.error(f"[PayPal] Execute thất bại: {error_info}")
                return Response({'error': 'Payment execution failed', 'details': error_info}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("[PayPal] Exception khi xử lý execute payment:")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
def create_paypal_payment(request):
    """Tạo thanh toán PayPal cho đơn hàng."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
            if not order_id:
                return JsonResponse({'error': 'Order ID is required.'}, status=400)
            try:
                order = Order.objects.get(pk=order_id)
            except Order.DoesNotExist:
                logger.error(f"[PayPal] Order not found with id={order_id}")
                return JsonResponse({'error': 'Order not found.'}, status=404)
            total_amount = order.total_amount
            configure_paypal()
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "redirect_urls": {
                    "return_url": "http://localhost:3000/payment-success",
                    "cancel_url": "http://localhost:3000/payment-failed"
                },
                "transactions": [{
                    "amount": {"total": str(total_amount), "currency": "USD"},
                    "description": f"Order #{order_id}"
                }]
            })
            if payment.create():
                order.payment_method = 'PayPal'
                order.payment_id = payment.id
                order.status = 'Processing'
                order.save()
                logger.info(f"[PayPal] Payment created, order {order.id} updated with payment_id {payment.id} and status Pending.")
                payment_url = next(link.href for link in payment.links if link.rel == "approval_url")
                return JsonResponse({
                    "orderID": payment.id,
                    "order_id": order.id,
                    "payment_url": payment_url
                })
            else:
                logger.error(f"[PayPal] Error creating payment: {getattr(payment, 'error', 'Unknown error')}")
                return JsonResponse({'error': 'Error creating the payment'}, status=400)
        except Exception as e:
            logger.exception("[PayPal] Exception in create_paypal_payment:")
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

@csrf_exempt
def payment_success(request):
    """Xử lý callback thành công từ PayPal."""
    payment_id = request.GET.get('paymentId')
    payer_id = request.GET.get('PayerID')
    logger.info(f"[PayPal] payment_success called with paymentId={payment_id}, payerId={payer_id}")
    if payment_id and payer_id:
        try:
            configure_paypal()
            payment = paypalrestsdk.Payment.find(payment_id)
            logger.info(f"[PayPal] Payment found: {payment}")
            if payment.execute({'payer_id': payer_id}):
                try:
                    order = Order.objects.get(payment_id=payment_id)
                    if order.status != 'Processing':
                        order.status = 'Processing'
                        order.save()
                        logger.info(f"[PayPal] Payment executed and order {order.id} updated to Processing.")
                    else:
                        logger.info(f"[PayPal] Order {order.id} already in Processing state.")
                    return render(request, 'payment_success.html')
                except Order.DoesNotExist:
                    logger.error(f"[PayPal] No order found with payment_id={payment_id}")
                    return render(request, 'payment_failure.html', {'error': 'Không tìm thấy đơn hàng tương ứng.'})
            else:
                logger.error(f"[PayPal] Payment execute failed: {getattr(payment, 'error', 'Unknown error')}")
                return render(request, 'payment_failure.html', {'error': 'Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.'})
        except Exception as e:
            logger.exception("[PayPal] Exception in payment_success:")
            return render(request, 'payment_failure.html', {'error': f'Đã xảy ra lỗi: {str(e)}'})
    else:
        logger.error("[PayPal] Missing paymentId or payerId in request.")
        return render(request, 'payment_failure.html', {'error': 'Thiếu thông tin thanh toán từ PayPal.'})

@csrf_exempt
def payment_cancel(request):
    """Xử lý callback hủy thanh toán từ PayPal."""
    return render(request, 'payment_cancel.html')

# ========================
# LIKE VIEWS
# ========================
class LikeViewSet(viewsets.ModelViewSet):
    """ViewSet quản lý like sản phẩm."""
    queryset = Like.objects.all()
    serializer_class = serializers.LikeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def like(self, request):
        product_id = request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id)
        like, created = Like.objects.get_or_create(user=request.user, product=product)
        if created:
            return Response({'status': 'product liked'})
        else:
            return Response({'status': 'product already liked'})

    @action(detail=False, methods=['post'])
    def unlike(self, request):
        product_id = request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id)
        like = Like.objects.filter(user=request.user, product=product).first()
        if like:
            like.delete()
            return Response({'status': 'product unliked'})
        else:
            return Response({'status': 'like does not exist'}, status=400)

    @action(detail=False, methods=['get'], url_path='list-like')
    def list_like(self, request):
        user = request.user
        liked_products = Like.objects.filter(user=user).select_related('product')
        serializer = serializers.ProductSerializer([like.product for like in liked_products], many=True)
        return Response(serializer.data)

# ========================
# NEWS CATEGORY VIEWS
# ========================
class NewsCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for news categories (read-only for public access)"""
    queryset = NewsCategory.objects.filter(is_active=True)
    serializer_class = serializers.NewsCategorySerializer
    
    @action(detail=True, methods=['get'], url_path='articles')
    def articles(self, request, pk=None):
        """Get published articles in this category"""
        category = self.get_object()
        articles = News.objects.filter(
            category=category, 
            is_published=True, 
            is_active=True
        ).order_by('-published_at')
        
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = serializers.NewsListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = serializers.NewsListSerializer(articles, many=True)
        return Response(serializer.data)

# ========================
# NEWS VIEWS
# ========================
class NewsViewSet(viewsets.ModelViewSet):
    """ViewSet quản lý tin tức và bình luận."""
    serializer_class = serializers.NewsSerializer
    pagination_class = paginators.NewsPaginator

    def get_queryset(self):
        queryset = News.objects.filter(is_active=True)
        
        # Filter by publication status for non-staff users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(is_published=True)
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by tags
        tags = self.request.query_params.get('tags', None)
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            for tag in tag_list:
                queryset = queryset.filter(tags__icontains=tag)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(summary__icontains=search) |
                models.Q(content__icontains=search) |
                models.Q(tags__icontains=search)
            )
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-published_at')
        if ordering in ['published_at', '-published_at', 'title', '-title', 'view_count', '-view_count']:
            queryset = queryset.order_by(ordering)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return serializers.NewsListSerializer
        return serializers.NewsSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        elif self.action in ['comment']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Implement multiple layers of view tracking to prevent double counting
        session_key = f'news_viewed_{instance.id}'
        
        # Get client IP for additional tracking
        def get_client_ip(request):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            return ip
        
        client_ip = get_client_ip(request)
        ip_session_key = f'news_viewed_{instance.id}_{client_ip}'
        
        # Check both session and a cache-based approach
        should_increment = (
            not request.session.get(session_key, False) and
            not request.session.get(ip_session_key, False)
        )
        
        if should_increment:
            # Increment view count only once per session AND IP
            instance.increment_view_count()
            request.session[session_key] = True
            request.session[ip_session_key] = True
            # Set session to expire after 1 hour for more precise tracking
            request.session.set_expiry(3600)  # 1 hour in seconds
            print(f"View count incremented for article {instance.id} from IP {client_ip}")
        else:
            print(f"View already counted for article {instance.id} from IP {client_ip}")
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """Get featured articles"""
        featured_articles = self.get_queryset().filter(is_featured=True)[:5]
        serializer = serializers.NewsListSerializer(featured_articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """Get recently published articles"""
        recent_articles = self.get_queryset().order_by('-published_at')[:10]
        serializer = serializers.NewsListSerializer(recent_articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='popular')
    def popular(self, request):
        """Get popular articles by view count"""
        popular_articles = self.get_queryset().order_by('-view_count')[:10]
        serializer = serializers.NewsListSerializer(popular_articles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='related')
    def related(self, request, pk=None):
        """Get related articles based on category and tags"""
        article = self.get_object()
        related_queryset = self.get_queryset().exclude(pk=article.pk)
        
        # Prefer articles from same category
        if article.category:
            related_queryset = related_queryset.filter(category=article.category)
        
        # If we have tags, also filter by similar tags
        if article.tags:
            tag_list = article.tag_list
            for tag in tag_list[:3]:  # Use top 3 tags
                related_queryset = related_queryset.filter(tags__icontains=tag)
        
        related_articles = related_queryset[:5]
        serializer = serializers.NewsListSerializer(related_articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='add-comments')
    def comment(self, request, pk=None):
        news = self.get_object()
        if request.method == 'GET':
            comments = news.comments.filter(parent_comment__isnull=True)
            serializer = serializers.NewsCommentSerializer(comments, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            try:
                customer = request.user.customer
            except Customer.DoesNotExist:
                return Response({"error": "Customer does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            content = request.data.get('content')
            parent_comment_id = request.data.get('parent_comment_id')
            if not content:
                return Response({'detail': 'Nội dung bình luận không được để trống'}, status=status.HTTP_400_BAD_REQUEST)
            parent_comment = None
            if parent_comment_id:
                try:
                    parent_comment = NewsComment.objects.get(id=parent_comment_id)
                except NewsComment.DoesNotExist:
                    return Response({'detail': 'Bình luận cha không tồn tại.'}, status=status.HTTP_400_BAD_REQUEST)
            comment = NewsComment.objects.create(
                news=news,
                user=customer,
                content=content,
                parent_comment=parent_comment
            )
            serializer = serializers.NewsCommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class NewsCommentView(generics.ListCreateAPIView):
    """API quản lý bình luận tin tức."""
    serializer_class = serializers.NewsCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        news_id = self.kwargs['news_id']
        return NewsComment.objects.filter(news_id=news_id)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        news_id = self.kwargs['news_id']
        parent_comment_id = request.data.get('parent_comment', None)
        if parent_comment_id:
            parent_comment = NewsComment.objects.filter(id=parent_comment_id).first()
            if not parent_comment:
                return Response({'error': 'Parent comment not found.'}, status=404)
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=self.request.user.customer, news_id=news_id, parent_comment=parent_comment)
        else:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=self.request.user.customer, news_id=news_id)
        return Response(serializer.data, status=201)

# ========================
# ADDRESS VIEWS
# ========================
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = paginators.AddressPaginator
    
    def get_queryset(self):
        try:
            # Lấy customer instance từ user hiện tại
            customer = Customer.objects.get(id=self.request.user.id)
            return Address.objects.filter(customer=customer, is_active=True)
        except Customer.DoesNotExist:
            return Address.objects.none()
    
    def perform_create(self, serializer):
        try:
            # Lấy Customer instance từ user hiện tại (Customer kế thừa từ User nên có cùng id)
            customer = Customer.objects.get(id=self.request.user.id)
            
            # Kiểm tra xem đã có địa chỉ nào chưa
            existing_addresses = Address.objects.filter(customer=customer)
            
            # Nếu chưa có địa chỉ nào, đặt địa chỉ này làm mặc định
            is_default = not existing_addresses.exists()
            
            # Lưu địa chỉ với customer instance đúng
            serializer.save(customer=customer, is_default=is_default)
        except Customer.DoesNotExist:
            raise ValidationError({
                "error": "Customer not found",
                "detail": "Current user does not have a customer profile" })
    
    def perform_update(self, serializer):
        try:
            # Lấy Customer instance từ user hiện tại (Customer kế thừa từ User nên có cùng id)
            customer = Customer.objects.get(id=self.request.user.id)
            serializer.save(customer=customer)
        except Customer.DoesNotExist:
            raise ValidationError("User is not a customer")
    
    @action(methods=['post'], detail=True, url_path='set-default')
    def set_default(self, request, pk=None):
        try:
            # Lấy Customer instance từ user hiện tại (Customer kế thừa từ User nên có cùng id)
            customer = Customer.objects.get(id=request.user.id)
            address = self.get_object()
            
            # Bỏ mặc định các địa chỉ khác
            Address.objects.filter(customer=customer).update(is_default=False)
            
            # Đặt địa chỉ này làm mặc định
            address.is_default = True
            address.save()
            
            return Response({'message': 'Successfully set as default address'})
        except Customer.DoesNotExist:
            return Response({'error': 'User is not a customer'}, 
                          status=status.HTTP_400_BAD_REQUEST)



# Google OAuth configuration
User = get_user_model()
GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_CLIENT_ID', None)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """Google OAuth login endpoint."""
    try:
        id_token = request.data.get('id_token')
        if not id_token:
            return JsonResponse({'detail': 'Missing id_token'}, status=400)

        # Verify token with Google
        try:
            info = google_id_token.verify_oauth2_token(
                id_token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )
        except ValueError as ve:
            logger.warning(f"Google token verification failed: {str(ve)}")
            return JsonResponse({'detail': f'Invalid Google token: {str(ve)}'}, status=400)

        # Validate token claims
        validate_token_claims(info)

        # Create or update user
        user = create_or_update_user(info)
        logger.info(f"User processed for Google login: {user.id}, {user.email}")

        # Ensure Customer profile exists
        ensure_customer_profile(user)

        # Create OAuth tokens
        tokens = create_oauth_tokens(user)

        return JsonResponse(tokens, status=200)
    except Exception as e:
        logger.error(f"Google login error: {str(e)}", exc_info=True)
        return JsonResponse({'detail': str(e)}, status=400)


def validate_token_claims(info):
    """Validate Google token claims."""
    aud = info.get('aud') or info.get('audience')
    if not aud or aud != GOOGLE_CLIENT_ID:
        raise ValidationError('Token audience mismatch')

    iss = info.get('iss')
    if iss not in ['accounts.google.com', 'https://accounts.google.com']:
        raise ValidationError('Invalid token issuer')

    if not info.get('email'):
        raise ValidationError('Email claim missing')

    if not info.get('email_verified'):
        raise ValidationError('Email not verified')


def create_or_update_user(info):
    """Create or update user from Google info."""
    email = info['email']
    given_name = info.get('given_name', '')
    family_name = info.get('family_name', '')

    try:
        # Try to find existing user by email
        user = User.objects.get(email=email)
        # Update existing user info
        user.first_name = given_name or user.first_name
        user.last_name = family_name or user.last_name
        user.save()
        return user
    except User.DoesNotExist:
        # Create new user
        username = email
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{email}_{counter}"
            counter += 1
        
        user = User.objects.create(
            email=email,
            username=username,
            first_name=given_name,
            last_name=family_name,
            is_staff=False
        )
        return user


def ensure_customer_profile(user):
    """Ensure user has customer profile."""
    try:
        # Try to get existing customer profile
        customer = Customer.objects.get(id=user.id)
    except Customer.DoesNotExist:
        # Create new customer profile by copying from user
        customer = Customer(
            id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_staff=user.is_staff,
            is_superuser=user.is_superuser,
            is_active=user.is_active,
            date_joined=user.date_joined,
            last_login=user.last_login,
            password=user.password,
            phone='',
            point=0,
            created_at=user.created_at,
            updated_at=timezone.now()
        )
        customer.save()

    # Assign customer permission
    try:
        customer_perm = Permission.objects.get(codename='customer')
        if not user.has_perm('api.customer'):
            user.user_permissions.add(customer_perm)
            user.save()
    except Permission.DoesNotExist:
        pass

    return customer


def create_oauth_tokens(user):
    """Create access token and refresh token."""
    try:
        application = Application.objects.get(client_id=settings.CLIENT_ID)
    except Application.DoesNotExist:
        raise ValidationError('OAuth application not configured')

    access_token_ttl = getattr(settings, 'OAUTH2_PROVIDER', {}).get(
        'ACCESS_TOKEN_EXPIRE_SECONDS',
        36000
    )

    access_token = secrets.token_urlsafe(40)
    refresh_token = secrets.token_urlsafe(40)
    now = timezone.now()

    # Create access token
    access_token_obj = AccessToken.objects.create(
        user=user,
        application=application,
        token=access_token,
        scope='read write',
        expires=now + timedelta(seconds=access_token_ttl)
    )

    # Create refresh token
    RefreshToken.objects.create(
        user=user,
        application=application,
        token=refresh_token,
        access_token=access_token_obj
    )

    return {
        'access_token': access_token,
        'token_type': 'Bearer',
        'expires_in': access_token_ttl,
        'refresh_token': refresh_token
    }


# ========================
# COUPON VIEWS
# ========================
class CouponViewSet(viewsets.ModelViewSet):
    """ViewSet for managing coupons"""
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = serializers.CouponSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve', 'validate_coupon', 'my_coupons', 'claim_coupon']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only staff can create/update/delete coupons
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return super().get_permissions()
    
    def get_queryset(self):
        """Filter coupons based on user role"""
        user = self.request.user
        if user.is_staff:
            # Staff can see all coupons
            return Coupon.objects.all().order_by('-created_at')
        else:
            # Customers can only see active public coupons and their assigned private coupons
            try:
                customer = Customer.objects.get(id=user.id)
                public_coupons = Coupon.objects.filter(
                    is_active=True,
                    coupon_type__in=['public', 'first_time', 'loyalty']
                )
                private_coupons = Coupon.objects.filter(
                    is_active=True,
                    coupon_type='private',
                    assigned_customers__customer=customer
                )
                return (public_coupons | private_coupons).distinct().order_by('-created_at')
            except Customer.DoesNotExist:
                # If user is not a customer, return only public coupons
                return Coupon.objects.filter(
                    is_active=True,
                    coupon_type='public'
                ).order_by('-created_at')
    
    @action(detail=False, methods=['post'], url_path='claim')
    def claim_coupon(self, request):
        """Allow customers to claim a coupon by entering its code"""
        try:
            customer = Customer.objects.get(id=request.user.id)
        except Customer.DoesNotExist:
            return Response({
                'error': 'User is not a customer'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        code = request.data.get('code', '').strip().upper()
        if not code:
            return Response({
                'error': 'Coupon code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({
                'error': 'Invalid coupon code or coupon is not active'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if it's a private coupon and if customer already has access
        if coupon.coupon_type == 'private':
            if CustomerCoupon.objects.filter(customer=customer, coupon=coupon).exists():
                return Response({
                    'error': 'You already have this coupon in your account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Assign the private coupon to the customer
            CustomerCoupon.objects.create(
                customer=customer,
                coupon=coupon
            )
            
            return Response({
                'message': f'Coupon {coupon.code} successfully added to your account!',
                'coupon': serializers.CouponSerializer(coupon).data
            })
        
        # For public coupons, just confirm they can claim it
        elif coupon.coupon_type in ['public', 'first_time', 'loyalty']:
            # Check if customer can use this coupon
            can_use, message = coupon.can_be_used_by_customer(customer)
            
            if can_use:
                return Response({
                    'message': f'Coupon {coupon.code} is now available for use in your account!',
                    'coupon': serializers.CouponSerializer(coupon).data
                })
            else:
                return Response({
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': 'Invalid coupon type'
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='validate')
    def validate_coupon(self, request):
        """Validate a coupon for a specific order amount"""
        serializer = serializers.CouponValidationSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data['code']
            order_amount = serializer.validated_data['order_amount']
            
            try:
                coupon = Coupon.objects.get(code=code, is_active=True)
                customer = Customer.objects.get(id=request.user.id)
                
                can_use, message = coupon.can_be_used_by_customer(customer, order_amount)
                
                if can_use:
                    discount_amount = coupon.calculate_discount(order_amount)
                    return Response({
                        'valid': True,
                        'message': message,
                        'coupon': serializers.CouponSerializer(coupon).data,
                        'discount_amount': discount_amount,
                        'final_amount': order_amount - discount_amount
                    })
                else:
                    return Response({
                        'valid': False,
                        'message': message
                    })
                    
            except Coupon.DoesNotExist:
                return Response({
                    'valid': False,
                    'message': 'Invalid coupon code'
                })
            except Customer.DoesNotExist:
                return Response({
                    'valid': False,
                    'message': 'User is not a customer'
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='my-coupons')
    def my_coupons(self, request):
        """Get coupons available to the current customer"""
        try:
            customer = Customer.objects.get(id=request.user.id)
            
            # Get public coupons
            public_coupons = Coupon.objects.filter(
                is_active=True,
                coupon_type__in=['public', 'first_time', 'loyalty']
            )
            
            # Get private coupons assigned to this customer
            private_coupons = Coupon.objects.filter(
                is_active=True,
                coupon_type='private',
                assigned_customers__customer=customer
            )
            
            # Combine and remove duplicates
            available_coupons = (public_coupons | private_coupons).distinct()
            
            # Filter based on first-time customer logic
            filtered_coupons = []
            for coupon in available_coupons:
                can_use, _ = coupon.can_be_used_by_customer(customer)
                if can_use:
                    filtered_coupons.append(coupon)
            
            serializer = serializers.CustomerAvailableCouponsSerializer(
                filtered_coupons, 
                many=True, 
                context={'request': request}
            )
            return Response(serializer.data)
            
        except Customer.DoesNotExist:
            return Response({
                'error': 'User is not a customer'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='assign-to-customer')
    def assign_to_customer(self, request, pk=None):
        """Assign a private coupon to a customer (admin only)"""
        if not request.user.is_staff:
            return Response({
                'error': 'Only staff can assign coupons to customers'
            }, status=status.HTTP_403_FORBIDDEN)
        
        coupon = self.get_object()
        customer_id = request.data.get('customer_id')
        
        if not customer_id:
            return Response({
                'error': 'customer_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            customer = Customer.objects.get(id=customer_id)
            
            # Check if already assigned
            if CustomerCoupon.objects.filter(customer=customer, coupon=coupon).exists():
                return Response({
                    'error': 'Coupon already assigned to this customer'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create assignment
            assignment = CustomerCoupon.objects.create(
                customer=customer,
                coupon=coupon,
                assigned_by=request.user
            )
            
            return Response({
                'message': f'Coupon {coupon.code} assigned to {customer.get_full_name()}',
                'assignment': serializers.CustomerCouponSerializer(assignment).data
            })
            
        except Customer.DoesNotExist:
            return Response({
                'error': 'Customer not found'
            }, status=status.HTTP_404_NOT_FOUND)


class CouponUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing coupon usage history"""
    queryset = CouponUsage.objects.all().order_by('-used_at')
    serializer_class = serializers.CouponUsageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter usage based on user role"""
        user = self.request.user
        if user.is_staff:
            # Staff can see all usage
            return CouponUsage.objects.all().order_by('-used_at')
        else:
            # Customers can only see their own usage
            try:
                customer = Customer.objects.get(id=user.id)
                return CouponUsage.objects.filter(customer=customer).order_by('-used_at')
            except Customer.DoesNotExist:
                return CouponUsage.objects.none()


class CustomerCouponViewSet(viewsets.ModelViewSet):
    """ViewSet for managing customer coupon assignments"""
    queryset = CustomerCoupon.objects.all().order_by('-assigned_at')
    serializer_class = serializers.CustomerCouponSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def perform_create(self, serializer):
        """Set the assigned_by field to current user"""
        serializer.save(assigned_by=self.request.user)
