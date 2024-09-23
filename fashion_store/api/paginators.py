from rest_framework import pagination

from rest_framework import pagination


class ProductPaginator(pagination.PageNumberPagination):
    page_size = 5

class UserPaginator(pagination.PageNumberPagination):
    page_size = 5
