from django.urls import path, include
from rest_framework import routers
from api import views
from api.views import create_paypal_payment, payment_success, payment_cancel

# Đăng ký các viewset vào router
router = routers.DefaultRouter()
router.register('categories', views.CategoryViewSet, basename='categories')
router.register('products', views.ProductViewSet, basename='products')
router.register('users', views.UserViewSet, basename='users')
router.register('carts', views.CartViewSet, basename='carts')
router.register('orders', views.OrderViewSet, basename='orders')
router.register('likes', views.LikeViewSet, basename='likes')
router.register('news', views.NewsViewSet, basename='news')
router.register('addresses', views.AddressViewSet, basename='addresses')

urlpatterns = [
    # Đường dẫn cho carts (truy xuất giỏ hàng)
    path('carts/', views.CartViewSet.as_view({'get': 'retrieve'}), name='cart_retrieve'),

    # Đường dẫn cho đăng nhập
    path('login/', views.LoginView.as_view(), name='login'),

    path('comments/<int:news_id>/comment/', views.NewsCommentView.as_view(), name='news-comments'),

    path('create_paypal_payment/', create_paypal_payment, name='create_paypal_payment'),
    path('payment/success/', payment_success, name='payment_success'),
    path('payment/cancel/', payment_cancel, name='payment_cancel'),

    path('auth/google/', views.google_login, name='google_login'),
    path('orders/execute-paypal-payment/', views.ExecutePaypalPaymentView.as_view(), name='paypal-execute'),
    # Bao gồm tất cả các đường dẫn từ router
    path('', include(router.urls)),
]
