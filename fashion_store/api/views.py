from django.http import JsonResponse
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions as builtin_permission
from django.shortcuts import get_object_or_404
from django.db import transaction

import requests
from django.conf import settings
import logging

from api.models import Product, Category, User, Cart, CartItem, Order, OrderDetail, Customer
from api import serializers, paginators

logger = logging.getLogger(__name__)

class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = serializers.CategorySerializer
    pagination_class = paginators.Category


## Create product by admin
    @action(methods=['post'], url_path='admin/product', detail=False)
    def post_product(self, request, pk=None):
        try:
            # Lấy category dựa trên pk
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

class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = serializers.ProductSerializer
    pagination_class = paginators.ProductPaginator

    def get_queryset(self):
        queryset = self.queryset

        if self.action == 'list':
            q = self.request.query_params.get('q')
            if q:
                queryset = queryset.filter(name__icontains=q)

            category_id = self.request.query_params.get('category_id')
            if category_id:
                queryset = queryset.filter(category_id=category_id)

        return queryset

    @action(methods=['get'], url_path='product-detail', detail=True)
    def get_product_detail(self,request, pk=True):
        try:
            product = Product.objects.get(pk=pk,is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializers.ProductSerializer(product).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='category/(?P<category_id>[^/.]+)', detail=False)
    def products_by_category(self, request, category_id=None):
        try:
            category = Category.objects.get(pk=category_id, is_active=True)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

        # Lọc các sản phẩm theo category
        products = Product.objects.filter(category=category, is_active=True)
        page = self.paginate_queryset(products)

        if page is not None:
            serializer = self.get_paginated_response(serializers.ProductSerializer(page, many=True).data)
        else:
            serializer = serializers.ProductSerializer(products, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


## Update product by Admin
    @action(methods=['patch'], url_path='admin/product', detail=True)
    def update_product(self, request, pk=None):
        product = self.get_object()
        serializer = serializers.ProductSerializer(product, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView, generics.ListCreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    pagination_class = paginators.UserPaginator
    def get_permissions(self):
        if self.action in ['partial_update']:
            return [permissions.UserOwnerPermission(), ]
        elif self.action in ['create']:
            return [builtin_permission.AllowAny(), ]

        return [builtin_permission.IsAuthenticated(), ]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False)
    def get_current_user(self, request):
        user = request.user
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                setattr(user, k, v)
            user.save()

        return Response(serializers.UserSerializer(user).data)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("LoginView.post called")  # Ghi lại thông tin khi phương thức được gọi

        username = request.data.get('username')
        password = request.data.get('password')

        # Kiểm tra xem username và password có được cung cấp không
        if not username or not password:
            logger.warning("Missing username or password")  # Ghi lại cảnh báo
            return JsonResponse({'error': 'Username và password là bắt buộc'}, status=400)

        TOKEN_URL = 'http://127.0.0.1:8000/o/token/'  # Địa chỉ token endpoint

        # Gửi yêu cầu đến token endpoint với client_id và client_secret từ backend
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
        }, timeout=10)  # Thêm timeout cho yêu cầu để tránh treo lâu quá

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
            logger.error("Token request failed: %s", response.json())  # Ghi lại lỗi nếu yêu cầu không thành công
            return JsonResponse(response.json(), status=response.status_code)

class CartViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    serializer_class = serializers.CartSerializer

    # Khai báo queryset để tránh lỗi
    queryset = Cart.objects.all()

    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

    def get_permissions(self):
        if self.action in ['add_to_cart', 'remove_cart']:
            return [builtin_permission.IsAuthenticated(), ]
        return super().get_permissions()

    @action(methods=['post'], detail=False, url_path='add-cart')
    def add_to_cart(self, request):
        cart_items_data = request.data.get('items', [])
        cart_items = []

        for item_data in cart_items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity')

            if quantity is None or quantity <= 0:
                return Response({'detail': 'Số lượng phải lớn hơn không'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({'detail': f'Sản phẩm với id {product_id} không tồn tại'},
                                status=status.HTTP_404_NOT_FOUND)

            if product.quantity < quantity:
                return Response({'detail': f'Không đủ hàng cho sản phẩm {product_id}'},
                                status=status.HTTP_400_BAD_REQUEST)

            cart, created = Cart.objects.get_or_create(user=request.user)

            # Tạo hoặc cập nhật CartItem với số lượng
            cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product,
                                                                defaults={'quantity': quantity})

            if not created:
                # Cập nhật số lượng nếu đã tồn tại
                cart_item.quantity += quantity

            cart_item.save()  # Lưu cart_item vào cơ sở dữ liệu
            cart_items.append(cart_item.id)

        return Response({'detail': 'Sản phẩm đã được thêm vào giỏ hàng', 'cart_items': cart_items},
                        status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=False, url_path='remove/(?P<cart_item_id>[^/.]+)')
    def remove_cart(self, request, cart_item_id=None):
        cart = get_object_or_404(Cart, user=request.user)
        try:
            cart_item = CartItem.objects.get(cart=cart, id=cart_item_id)
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Sản phẩm không tồn tại trong giỏ hàng'}, status=status.HTTP_404_NOT_FOUND)

class OrderViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Order.objects.filter(is_active=True)
    serializer_class = serializers.OrderSerializer
    permission_classes = [builtin_permission.IsAuthenticated]

    def get_queryset(self):
        # Lọc đơn hàng theo người dùng hiện tại
        return self.queryset.filter(user=self.request.user)

    @action(methods=['post'], detail=False, url_path='checkout')
    def checkout(self, request):
        user = request.user

        # Lấy đối tượng Customer từ User
        try:
            customer = Customer.objects.get(username=user.username)  # hoặc user.id
        except Customer.DoesNotExist:
            return Response({'error': 'Người dùng không phải là khách hàng'}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get('shipping_address')
        payment_method = request.data.get('payment_method', 'Cash')  # Nhận phương thức thanh toán từ frontend
        payment_status = 'Pending'  # Khởi tạo trạng thái thanh toán

        # Kiểm tra phương thức thanh toán hợp lệ
        valid_payment_methods = [choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]
        if payment_method not in valid_payment_methods:
            return Response({'error': 'Phương thức thanh toán không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.filter(user=customer).first()  # Thay đổi ở đây
            if not cart:
                return Response({'error': 'Giỏ hàng không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

            cart_items = cart.items.select_related('product')
            if not cart_items.exists():
                return Response({'error': 'Giỏ hàng trống'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                total_amount = 0
                for item in cart_items:
                    product = item.product
                    if product.quantity < item.quantity:
                        raise ValidationError(f'Số lượng sản phẩm {product.name} không đủ')

                    product.quantity -= item.quantity
                    product.save()
                    total_amount += item.quantity * product.price

                order = Order.objects.create(
                    user=customer,  # Gán đúng đối tượng Customer
                    total_amount=total_amount,
                    payment_status=payment_status,
                    payment_method=payment_method,
                    shipping_address=shipping_address
                )

                for item in cart_items:
                    OrderDetail.objects.create(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                        unit_price=item.product.price,
                        totalPrice=item.quantity * item.product.price
                    )

                # Xóa các mục trong giỏ hàng sau khi thanh toán thành công
                cart_items.delete()

            serializer = serializers.OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Cart.DoesNotExist:
            return Response({'error': 'Giỏ hàng không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as ve:
            return Response({'error': ve.message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
