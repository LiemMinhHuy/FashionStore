import logging
from datetime import datetime
from urllib.parse import urlencode

import paypalrestsdk
import requests
from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from api import serializers, paginators, forms, utils
from api.models import Product, Category, User, Cart, CartItem, Order, OrderDetail, Customer, Like, News, NewsComment, Address
from paypalrestsdk import api
import hashlib
import urllib.parse
import json

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
            sort_option = self.request.query_params.get('sortOption', 'latest')
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
            for k, v in request.data.items():
                setattr(user, k, v)
            user.save()
        return Response(self.get_serializer(user).data)

class LoginView(APIView):
    """API đăng nhập người dùng."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("LoginView.post called")
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            logger.warning("Missing username or password")
            return JsonResponse({'error': 'Username và password là bắt buộc'}, status=400)
        TOKEN_URL = 'http://127.0.0.1:8000/o/token/'
        logger.info("Requesting token with:")
        logger.info(f"Username: {username}, Password: {password}")
        logger.info(f"CLIENT_ID: {settings.CLIENT_ID}")
        logger.info(f"CLIENT_SECRET: {settings.CLIENT_SECRET}")
        response = requests.post(TOKEN_URL, data={
            'grant_type': 'password',
            'username': username,
            'password': password,
            'client_id': settings.CLIENT_ID,
            'client_secret': settings.CLIENT_SECRET
        }, timeout=10)
        logger.info("Response Status Code: %s", response.status_code)
        logger.info("Response Content: %s", response.content)
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
        shipping_address = request.data.get('shipping_address')
        payment_method = request.data.get('payment_method', 'Cash')
        if payment_method not in [choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]:
            return Response({'error': 'Phương thức thanh toán không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)
        cart = Cart.objects.filter(user=customer).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Giỏ hàng không tồn tại hoặc trống'}, status=status.HTTP_400_BAD_REQUEST)
        total_amount = sum(item.product.price * item.quantity for item in cart.items.all())
        order_status = "Processing" if payment_method == "Cash" else "Pending"
        order = Order.objects.create(
            user=customer,
            total_amount=total_amount,
            payment_method=payment_method,
            shipping_address=shipping_address,
            created_at=timezone.localtime(),
            status=order_status
        )
        for item in cart.items.all():
            OrderDetail.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.product.price
            )
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
                return Response({'payment_url': payment_url}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Lỗi khi tạo thanh toán PayPal'}, status=status.HTTP_400_BAD_REQUEST)
        cart.items.all().delete()
        return Response(serializers.OrderSerializer(order).data, status=status.HTTP_201_CREATED)

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
# NEWS VIEWS
# ========================
class NewsViewSet(viewsets.ModelViewSet):
    """ViewSet quản lý tin tức và bình luận."""
    queryset = News.objects.all()
    serializer_class = serializers.NewsSerializer
    pagination_class = paginators.NewsPaginator

    def get_permissions(self):
        if self.action == ['comment']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
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
            serializer.save(user=request.user.customer, news_id=news_id, parent_comment=parent_comment)
        else:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user.customer, news_id=news_id)
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

