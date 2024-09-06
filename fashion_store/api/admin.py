from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse
from .models import User, Product, Category, Cart, CartItem, Order, OrderDetail, News, NewsComment

class FashionStoreAdminSite(admin.AdminSite):
    site_header = "Fashion Store Administration"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            # Define custom admin URLs here if needed
            # path('custom-url/', self.admin_view(self.custom_view), name='custom-view'),
        ]
        return custom_urls + urls

    # Define custom view if needed
    def custom_view(self, request):
        context = dict(
            self.each_context(request),
            # Add additional context variables if needed
        )
        return TemplateResponse(request, 'admin/custom_template.html', context)

admin_site = FashionStoreAdminSite(name='fashion_store_admin')

# Admin for User model
class UserAdmin(admin.ModelAdmin):
    search_fields = ['id', 'first_name', 'last_name', 'email']
    list_display = ['id', 'first_name', 'last_name', 'email', 'created_at']
    readonly_fields = ['created_at']
    list_per_page = 100

# Admin for Product model
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'category', 'created_at', 'updated_at']
    search_fields = ['name', 'category__name']
    list_filter = ['category', 'created_at']
    readonly_fields = ['created_at', 'updated_at']

# Admin for Category model
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_at', 'updated_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']

# Inline for CartItem model in CartAdmin
class CartItemInline(admin.TabularInline):
    model = CartItem
    readonly_fields = ['product', 'quantity']
    extra = 0

# Admin for Cart model
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at', 'updated_at']
    inlines = [CartItemInline]
    readonly_fields = ['created_at', 'updated_at']

# Inline for OrderDetail model in OrderAdmin
class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    readonly_fields = ['product', 'quantity', 'unit_price']
    extra = 0

# Admin for Order model
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'payment_status', 'shipping_address', 'created_at', 'updated_at']
    inlines = [OrderDetailInline]
    readonly_fields = ['created_at', 'updated_at']

# Inline for NewsComment model in NewsAdmin
class NewsCommentInline(admin.TabularInline):
    model = NewsComment
    extra = 1

# Admin for News model
class NewsAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_at', 'updated_at']
    search_fields = ['title']
    inlines = [NewsCommentInline]
    readonly_fields = ['created_at', 'updated_at']

# Register all models to the custom admin site
admin_site.register(User, UserAdmin)
admin_site.register(Product, ProductAdmin)
admin_site.register(Category, CategoryAdmin)
admin_site.register(Cart, CartAdmin)
admin_site.register(Order, OrderAdmin)
admin_site.register(News, NewsAdmin)
