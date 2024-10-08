from django.urls import path, include
from rest_framework import routers
from api import views

# Đăng ký các viewset vào router
router = routers.DefaultRouter()
router.register('categories', views.CategoryViewSet, basename='categories')
router.register('products', views.ProductViewSet, basename='products')
router.register('users', views.UserViewSet, basename='users')
router.register('carts', views.CartViewSet, basename='carts')
router.register('orders', views.OrderViewSet, basename='orders')

urlpatterns = [
    # Đường dẫn cho thanh toán VNPay
    path('vnpay/payment/', views.PaymentView.as_view(), name='payment'),
    path('vnpay/payment-ipn/', views.PaymentIPNView.as_view(), name='payment_ipn'),
    path('vnpay/payment-return/', views.PaymentReturnView.as_view(), name='payment_return'),
    # Đường dẫn cho carts (truy xuất giỏ hàng)
    path('carts/', views.CartViewSet.as_view({'get': 'retrieve'}), name='cart_retrieve'),

    # Đường dẫn cho đăng nhập
    path('login/', views.LoginView.as_view(), name='login'),

    # Bao gồm tất cả các đường dẫn từ router
    path('', include(router.urls)),
]
