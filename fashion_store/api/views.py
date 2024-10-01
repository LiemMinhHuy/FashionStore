from django.http import JsonResponse
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response


from api.models import Product, Category, User
from api import serializers, paginators
from rest_framework import permissions as builtin_permission


class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = serializers.CategorySerializer

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



from django.http import JsonResponse
from rest_framework.views import APIView
import requests
from rest_framework import permissions
from django.conf import settings
import logging

# Tạo logger
logger = logging.getLogger(__name__)


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


