from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api import views

r = routers.DefaultRouter()
r.register('categories', views.CategoryViewSet, basename='categories')
r.register('products', views.ProductViewSet, basename='products')
r.register('users', views.UserViewSet, basename='users')

urlpatterns = [
    path('', include(r.urls)),
]
