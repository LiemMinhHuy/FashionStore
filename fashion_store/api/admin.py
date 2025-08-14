from django.contrib import admin
from .models import (
    Customer, Staff, Category, Product, Cart, CartItem,
    Order, OrderDetail, News, NewsComment, Like
)
from django.template.response import TemplateResponse
from django.db.models import Count
from django.urls import path, reverse
from django.utils.html import format_html
class FashionStoreAdminSite(admin.AdminSite):
    site_header = "Fashion Store Administration"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('category-stats/', self.admin_view(self.category_stats_view), name='category-stats'),
        ]
        return custom_urls + urls

    def category_stats_view(self, request):
        categories = Category.objects.all()
        course_stats = categories.annotate(c=Count('product'))  # Đảm bảo rằng 'product' là trường hợp đúng
        context = {
            'course_stats': course_stats,
        }
        return TemplateResponse(request, 'admin/category_stats.html', context)

    def category_stats_button(self, request):
        return format_html(
            '<a class="button" href="{}">Xem Biểu Đồ</a>',
            reverse('admin:category-stats')  # Sử dụng reverse để tạo URL
        )

    # Thêm nút vào giao diện admin
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['category_stats_button'] = self.category_stats_button(request)
        return super(FashionStoreAdminSite, self).index(request, extra_context=extra_context)

# Tạo một instance của AdminSite
admin_site = FashionStoreAdminSite(name='fashion_store_admin')


# User Admin - Customer and Staff
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    search_fields = ['id', 'username', 'email']
    list_display = ['id', 'username', 'email', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    search_fields = ['id', 'username', 'email']
    list_display = ['id', 'username', 'email', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active']
    readonly_fields = ['created_at', 'updated_at']


# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ['name']
    list_display = ['id', 'name', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    list_filter = ['created_at']


# Product Admin with actions and category filtering
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'category', 'quantity', 'created_at', 'updated_at']
    search_fields = ['name', 'category__name']
    list_filter = ['category', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['mark_as_active', 'mark_as_inactive']

    def mark_as_active(self, request, queryset):
        queryset.update(is_active=True)
    mark_as_active.short_description = "Mark selected products as active"

    def mark_as_inactive(self, request, queryset):
        queryset.update(is_active=False)
    mark_as_inactive.short_description = "Mark selected products as inactive"


# Inline for CartItem in CartAdmin
class CartItemInline(admin.TabularInline):
    model = CartItem
    readonly_fields = ['product', 'quantity']
    extra = 0


# Cart Admin
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'created_at', 'updated_at']
    inlines = [CartItemInline]
    readonly_fields = ['created_at', 'updated_at', 'total_amount']


# Inline for OrderDetail in OrderAdmin
class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    readonly_fields = ['product', 'quantity', 'unit_price', 'totalPrice']
    extra = 0


# Order Admin
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'payment_status', 'payment_method', 'shipping_address', 'created_at', 'updated_at']
    search_fields = ['user__username', 'payment_status', 'payment_method']
    list_filter = ['payment_status', 'payment_method', 'created_at']
    readonly_fields = ['created_at', 'updated_at', 'total_amount']
    inlines = [OrderDetailInline]


# News Admin
@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_at', 'updated_at']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']
    list_filter = ['created_at']


# Inline for NewsComment in NewsAdmin
class NewsCommentInline(admin.TabularInline):
    model = NewsComment
    extra = 1
    readonly_fields = ['created_at', 'updated_at']


# NewsComment Admin
@admin.register(NewsComment)
class NewsCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'news', 'user', 'content', 'created_at', 'updated_at']
    search_fields = ['news__title', 'user__username']
    list_filter = ['created_at']
    readonly_fields = ['created_at', 'updated_at']


# Like Admin (to manage product likes)
@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'created_at']
    search_fields = ['user__username', 'product__name']
    list_filter = ['created_at']
    readonly_fields = ['created_at', 'updated_at']


# Register the custom admin site
admin_site.register(Customer, CustomerAdmin)
admin_site.register(Staff, StaffAdmin)
admin_site.register(Category, CategoryAdmin)
admin_site.register(Product, ProductAdmin)
admin_site.register(Cart, CartAdmin)
admin_site.register(Order, OrderAdmin)
admin_site.register(News, NewsAdmin)
admin_site.register(NewsComment, NewsCommentAdmin)
admin_site.register(Like, LikeAdmin)
