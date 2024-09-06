from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api import views

r = routers.DefaultRouter()
r.register('categories', views.CategoryViewSet, basename='categories')
r.register('product', views.ProductViewSet, basename='product')

urlpatterns = [
    path('', include(r.urls)),
]
