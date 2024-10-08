from rest_framework import generics
from rest_framework.utils.serializer_helpers import ReturnDict
from rest_framework.views import APIView
from rest_framework import permissions as builtin_permission

from urllib.parse import urlencode
from datetime import datetime
from django.http import JsonResponse, HttpResponseRedirect

from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404, redirect, render

import requests
from django.conf import settings

from api.models import Product, Category, User, Cart, CartItem, Order, OrderDetail, Customer, Like
from api import serializers, paginators, forms, utils
import logging
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

logger = logging.getLogger(__name__)

import hashlib
import urllib.parse
import logging

logger = logging.getLogger(__name__)

class vnpay:
    def __init__(self, secret_key):
        self.secret_key = secret_key
        self.params = {}

    def add_param(self, key, value):
        """Thêm tham số vào danh sách tham số."""
        self.params[key] = value

    def create_secure_hash(self):
        """Tạo chữ ký SHA256 cho các tham số."""
        # Sắp xếp các tham số theo tên khóa tăng dần
        sorted_params = sorted(self.params.items())
        data_string = '&'.join([f"{key}={value}" for key, value in sorted_params])
        logger.debug(f"Data string for hashing: {data_string}")

        # Thêm khóa bí mật vào cuối chuỗi
        hash_data = f"{data_string}&{self.secret_key}".encode('utf-8')
        logger.debug(f"Hash data string: {hash_data}")

        # Tạo chữ ký SHA256
        secure_hash = hashlib.sha256(hash_data).hexdigest().upper()
        logger.debug(f"Generated Secure Hash: {secure_hash}")

        return secure_hash

    def get_payment_url(self, base_url):
        """Tạo URL thanh toán với chữ ký."""
        secure_hash = self.create_secure_hash()
        encoded_params = urllib.parse.urlencode(self.params)
        payment_url = f"{base_url}?{encoded_params}&vnp_SecureHash={secure_hash}"
        logger.debug(f"Generated Payment URL: {payment_url}")
        return payment_url

    def validate_response(self, response_data):
        """Xác thực chữ ký từ phản hồi của VNPAY."""
        secure_hash = response_data.get('vnp_SecureHash')
        if not secure_hash:
            return False

        # Xóa chữ ký ra khỏi các tham số để tạo lại chữ ký
        response_data.pop('vnp_SecureHash', None)
        self.params = response_data  # Cập nhật params với dữ liệu phản hồi

        # Tạo chữ ký mới từ các tham số đã nhận
        computed_hash = self.create_secure_hash()
        is_valid = computed_hash == secure_hash
        logger.debug(f"Response is valid: {is_valid}")
        return is_valid



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

    def get_permissions(self):
        if self.action in ['like']:
            return [permissions.IsAuthenticated()]

        return [permissions.AllowAny()]

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

    @action(methods=['post'], detail=True, url_path='like')
    def like(self, request, pk=None):
        product = self.get_object()  # Get the product/lesson based on the primary key
        like, created = Like.objects.get_or_create(product=product, user=request.user)

        if not created:
            # Toggle the active status
            like.active = not like.active
            like.save()

        # Return the updated lesson details with the liked status
        return Response(serializers.AuthenticatedProductDetailsSerializer(product).data, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView, generics.ListCreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    pagination_class = paginators.UserPaginator

    def get_permissions(self):
        if self.action in ['partial_update']:
            return [permissions.UserOwnerPermission(), ]
        elif self.action in ['create']:
            return [permissions.AllowAny(), ]

        return [permissions.IsAuthenticated(), ]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False)
    def get_current_user(self, request):
        user = request.user
        if request.method == 'PATCH':
            for k, v in request.data.items():
                setattr(user, k, v)
            user.save()

        return Response(self.get_serializer(user).data)

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

class CartViewSet(viewsets.ViewSet):
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
        cart = self.get_object()  # Lấy giỏ hàng của người dùng
        cart_items = []

        for item_data in cart_items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity')

            if quantity is None or quantity <= 0:
                return Response({'detail': 'Số lượng phải lớn hơn không'}, status=status.HTTP_400_BAD_REQUEST)

            product = get_object_or_404(Product, id=product_id)

            if product.quantity < quantity:
                return Response({'detail': f'Không đủ hàng cho sản phẩm {product_id}'},
                                status=status.HTTP_400_BAD_REQUEST)

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

        # Cập nhật số lượng
        cart_item.quantity = quantity
        cart_item.save()

        return Response({'detail': 'Số lượng sản phẩm đã được cập nhật', 'quantity': cart_item.quantity},
                        status=status.HTTP_200_OK)

from rest_framework.request import Request
# Xóa hoặc gộp các định nghĩa trùng lặp của OrderViewSet
class OrderViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Order.objects.filter(is_active=True)
    serializer_class = serializers.OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = paginators.OrderPaginator

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(methods=['get'], detail=False, url_path='user-orders')
    def user_orders(self, request):
        user = get_object_or_404(Customer, id=request.user.id)
        orders = Order.objects.filter(user=user, is_active=True)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(methods=['post'], detail=False, url_path='checkout')
    def checkout(self, request):
        user = request.user
        try:
            customer = Customer.objects.get(username=user.username)
        except Customer.DoesNotExist:
            return Response({'error': 'Người dùng không phải là khách hàng'}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get('shipping_address')
        payment_method = request.data.get('payment_method', 'Cash')

        # Kiểm tra phương thức thanh toán
        if payment_method not in [choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]:
            return Response({'error': 'Phương thức thanh toán không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        cart = Cart.objects.filter(user=customer).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Giỏ hàng không tồn tại hoặc trống'}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = sum(item.product.price * item.quantity for item in cart.items.all())

        # Kiểm tra số tiền tối thiểu
        if total_amount < 1000:
            return Response({'error': 'Số tiền tối thiểu để thanh toán là 1,000 VND'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Tạo đơn hàng
        order = Order.objects.create(
            user=customer,
            total_amount=total_amount,
            payment_method=payment_method,
            shipping_address=shipping_address,
            created_at=timezone.localtime(),
        )

        # Xử lý thanh toán VNPay
        if payment_method == 'VNPay':
            vnp = vnpay(settings.VNPAY_HASH_SECRET_KEY)

            # Thêm tham số thanh toán
            vnp.add_param("order_type", "billpayment")
            vnp.add_param("order_id", str(order.id))
            vnp.add_param("amount", total_amount * 100)  # Chuyển sang đơn vị VND
            vnp.add_param("order_desc", f"Thanh toán đơn hàng {order.id}")
            vnp.add_param("bank_code", "")  # Hoặc mã ngân hàng nếu cần
            vnp.add_param("language", "vn")
            vnp.add_param("vnp_IpAddr", utils.get_client_ip(request))
            vnp.add_param("vnp_CreateDate", timezone.now().strftime('%Y%m%d%H%M%S'))
            vnp.add_param("vnp_ReturnUrl", settings.VNPAY_RETURN_URL)

            # Tạo URL thanh toán
            payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL)

            return Response({'payment_url': payment_url}, status=status.HTTP_200_OK)

        # Lưu chi tiết đơn hàng
        for item in cart.items.all():
            OrderDetail.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.product.price
            )

        cart.items.all().delete()
        return Response(serializers.OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class PaymentView(APIView):
    def post(self, request):
        form = forms.PaymentForm(request.POST)
        if form.is_valid():
            order_type = form.cleaned_data['order_type']
            order_id = form.cleaned_data['order_id']
            amount = form.cleaned_data['amount']
            order_desc = form.cleaned_data['order_desc']
            bank_code = form.cleaned_data.get('bank_code', '')
            language = form.cleaned_data.get('language', 'vn')
            ipaddr = utils.get_client_ip(request)

            # Xây dựng URL Thanh Toán
            vnp = vnpay(settings.VNPAY_HASH_SECRET_KEY)
            vnp.add_param('vnp_Version', '2.1.0')
            vnp.add_param('vnp_Command', 'pay')
            vnp.add_param('vnp_TmnCode', settings.VNPAY_TMN_CODE)
            vnp.add_param('vnp_Amount', amount * 100)
            vnp.add_param('vnp_CurrCode', 'VND')
            vnp.add_param('vnp_TxnRef', order_id)
            vnp.add_param('vnp_OrderInfo', order_desc)
            vnp.add_param('vnp_OrderType', order_type)
            vnp.add_param('vnp_Locale', language)

            if bank_code:
                vnp.add_param('vnp_BankCode', bank_code)

            vnp.add_param('vnp_CreateDate', datetime.now().strftime('%Y%m%d%H%M%S'))
            vnp.add_param('vnp_IpAddr', ipaddr)
            vnp.add_param('vnp_ReturnUrl', settings.VNPAY_RETURN_URL)

            vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL)
            print(vnpay_payment_url)

            # Chuyển hướng đến VNPAY
            return HttpResponseRedirect(vnpay_payment_url)

        else:
            print("Dữ liệu biểu mẫu không hợp lệ")
            return render(request, "payment.html", {"title": "Thanh toán", "form": form})

    def get(self, request):
        form = forms.PaymentForm()
        return render(request, "payment.html", {"title": "Thanh toán", "form": form})

# views.py
class PaymentIPNView(APIView):
    def get(self, request):
        inputData = request.GET
        if inputData:
            vnp = vnpay()
            vnp.responseData = inputData.dict()
            order_id = inputData.get('vnp_TxnRef')
            amount = inputData.get('vnp_Amount')
            order_desc = inputData.get('vnp_OrderInfo')
            vnp_TransactionNo = inputData.get('vnp_TransactionNo')
            vnp_ResponseCode = inputData.get('vnp_ResponseCode')
            vnp_TmnCode = inputData.get('vnp_TmnCode')
            vnp_PayDate = inputData.get('vnp_PayDate')
            vnp_BankCode = inputData.get('vnp_BankCode')
            vnp_CardType = inputData.get('vnp_CardType')

            if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
                # Kiểm tra và cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
                firstTimeUpdate = True  # Thay đổi theo logic của bạn
                totalAmount = True  # Thay đổi theo logic của bạn

                if totalAmount:
                    if firstTimeUpdate:
                        if vnp_ResponseCode == '00':
                            print('Payment Success. Your code implement here')
                        else:
                            print('Payment Error. Your code implement here')

                        # Trả về cho VNPAY: Merchant update success
                        return Response({'RspCode': '00', 'Message': 'Confirm Success'}, status=status.HTTP_200_OK)
                    else:
                        # Đã cập nhật rồi
                        return Response({'RspCode': '02', 'Message': 'Order Already Updated'}, status=status.HTTP_200_OK)
                else:
                    # Số tiền không hợp lệ
                    return Response({'RspCode': '04', 'Message': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Chữ ký không hợp lệ
                return Response({'RspCode': '97', 'Message': 'Invalid Signature'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'RspCode': '99', 'Message': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

class PaymentReturnView(APIView):
    def get(self, request):
        inputData = request.GET
        if inputData:
            vnp = vnpay()
            vnp.responseData = inputData.dict()
            order_id = inputData.get('vnp_TxnRef')
            amount = int(inputData.get('vnp_Amount')) / 100
            order_desc = inputData.get('vnp_OrderInfo')
            vnp_TransactionNo = inputData.get('vnp_TransactionNo')
            vnp_ResponseCode = inputData.get('vnp_ResponseCode')
            vnp_TmnCode = inputData.get('vnp_TmnCode')
            vnp_PayDate = inputData.get('vnp_PayDate')
            vnp_BankCode = inputData.get('vnp_BankCode')
            vnp_CardType = inputData.get('vnp_CardType')

            if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
                if vnp_ResponseCode == "00":
                    return Response({
                        "title": "Kết quả thanh toán",
                        "result": "Thành công",
                        "order_id": order_id,
                        "amount": amount,
                        "order_desc": order_desc,
                        "vnp_TransactionNo": vnp_TransactionNo,
                        "vnp_ResponseCode": vnp_ResponseCode
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "title": "Kết quả thanh toán",
                        "result": "Lỗi",
                        "order_id": order_id,
                        "amount": amount,
                        "order_desc": order_desc,
                        "vnp_TransactionNo": vnp_TransactionNo,
                        "vnp_ResponseCode": vnp_ResponseCode
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "title": "Kết quả thanh toán",
                    "result": "Lỗi",
                    "order_id": order_id,
                    "amount": amount,
                    "order_desc": order_desc,
                    "vnp_TransactionNo": vnp_TransactionNo,
                    "vnp_ResponseCode": vnp_ResponseCode,
                    "msg": "Sai checksum"
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                "title": "Kết quả thanh toán",
                "result": "Không có dữ liệu"
            }, status=status.HTTP_400_BAD_REQUEST)






