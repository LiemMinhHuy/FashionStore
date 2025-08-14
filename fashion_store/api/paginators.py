from rest_framework import pagination

from rest_framework import pagination


class ProductPaginator(pagination.PageNumberPagination):
    page_size = 10

class UserPaginator(pagination.PageNumberPagination):
    page_size = 10

class Category(pagination.PageNumberPagination):
    page_size = 7

class OrderPaginator(pagination.PageNumberPagination):
    page_size = 10

class LikePaginator(pagination.PageNumberPagination):
    page_size = 10

class NewsPaginator(pagination.PageNumberPagination):
    page_size = 10