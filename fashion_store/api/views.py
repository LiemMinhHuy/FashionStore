from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import permissions as builtin_permissions

from api.models import Product, Category
from api import serializers

class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = serializers.CategorySerializer

class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = serializers.ProductSerializer

    def get_queryset(self):
        queryset = self.queryset

        if self.action == 'list':
            name = self.request.query_params.get('name')
            if name:
                queryset = queryset.filter(name__icontains=name)

            category_id = self.request.query_params.get('category_id')
            if category_id:
                queryset = queryset.filter(category_id=category_id)

        return queryset

    @action(methods=['post'], detail=True)
    def update_price(self, request, pk=None):
        product = self.get_object()
        new_price = request.data.get('price')

        if not new_price:
            return Response({'error': 'Price is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_price = float(new_price)
        except ValueError:
            return Response({'error': 'Invalid price format.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_price <= 0:
            return Response({'error': 'Price must be a positive number.'}, status=status.HTTP_400_BAD_REQUEST)

        product.price = new_price
        product.save()

        return Response(self.get_serializer(product).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='related-products', detail=True)
    def get_related_products(self, request, pk=None):
        product = self.get_object()
        related_products = Product.objects.filter(category=product.category, is_active=True).exclude(id=product.id)

        name_filter = request.query_params.get('name')
        if name_filter:
            related_products = related_products.filter(name__icontains=name_filter)

        return Response(serializers.ProductSerializer(related_products, many=True).data, status=status.HTTP_200_OK)

