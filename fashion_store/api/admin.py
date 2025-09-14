from django.contrib import admin
from .models import (
    Customer, Staff, Category, Product, Cart, CartItem,
    Order, OrderDetail, News, NewsComment, Like, Address,
    Coupon, CustomerCoupon, CouponUsage
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


# Address Admin
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'full_name', 'phone', 'province', 'district', 'ward', 'is_default', 'created_at']
    search_fields = ['customer__username', 'full_name', 'phone', 'province', 'district']
    list_filter = ['province', 'district', 'is_default', 'is_billing', 'is_shipping', 'created_at']
    readonly_fields = ['created_at', 'updated_at', 'full_address', 'short_address', 'administrative_address']
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'full_name', 'phone')
        }),
        ('Address Details', {
            'fields': ('address_line1', 'address_line2', 'province', 'district', 'ward', 'postal_code', 'country')
        }),
        ('Address Types', {
            'fields': ('is_default', 'is_billing', 'is_shipping')
        }),
        ('Additional Info', {
            'fields': ('note', 'full_address', 'short_address', 'administrative_address')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )


# Coupon Usage Inline for Coupon Admin
class CouponUsageInline(admin.TabularInline):
    model = CouponUsage
    readonly_fields = ['customer', 'order', 'order_amount', 'discount_amount', 'used_at']
    extra = 0
    can_delete = False


# Customer Coupon Inline for Coupon Admin
class CustomerCouponInline(admin.TabularInline):
    model = CustomerCoupon
    readonly_fields = ['assigned_at']
    extra = 1


# Coupon Admin
@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'name', 'discount_type', 'discount_value', 'coupon_type', 
        'is_active', 'used_count', 'usage_limit', 'valid_from', 'valid_until'
    ]
    search_fields = ['code', 'name', 'description']
    list_filter = [
        'discount_type', 'coupon_type', 'is_active', 'valid_from', 'valid_until', 'created_at'
    ]
    readonly_fields = ['used_count', 'created_at', 'updated_at', 'is_valid', 'is_expired', 'usage_remaining']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'coupon_type')
        }),
        ('Discount Settings', {
            'fields': ('discount_type', 'discount_value', 'max_discount_amount')
        }),
        ('Usage Conditions', {
            'fields': ('min_order_amount', 'usage_limit', 'usage_limit_per_customer')
        }),
        ('Validity Period', {
            'fields': ('valid_from', 'valid_until')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Statistics', {
            'fields': ('used_count', 'usage_remaining', 'is_valid', 'is_expired'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    inlines = [CustomerCouponInline, CouponUsageInline]
    
    actions = ['mark_as_active', 'mark_as_inactive', 'extend_validity']
    
    def mark_as_active(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} coupons marked as active.')
    mark_as_active.short_description = "Mark selected coupons as active"
    
    def mark_as_inactive(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} coupons marked as inactive.')
    mark_as_inactive.short_description = "Mark selected coupons as inactive"
    
    def extend_validity(self, request, queryset):
        from datetime import timedelta
        from django.utils import timezone
        
        count = 0
        for coupon in queryset:
            # Extend validity by 30 days
            coupon.valid_until = coupon.valid_until + timedelta(days=30)
            coupon.save()
            count += 1
        
        self.message_user(request, f'{count} coupons validity extended by 30 days.')
    extend_validity.short_description = "Extend validity by 30 days"


# Customer Coupon Admin
@admin.register(CustomerCoupon)
class CustomerCouponAdmin(admin.ModelAdmin):
    list_display = ['customer', 'coupon', 'assigned_by', 'assigned_at']
    search_fields = ['customer__username', 'customer__email', 'coupon__code', 'coupon__name']
    list_filter = ['assigned_at', 'coupon__coupon_type']
    readonly_fields = ['assigned_at']
    
    fieldsets = (
        ('Assignment Details', {
            'fields': ('customer', 'coupon', 'assigned_by')
        }),
        ('Timestamps', {
            'fields': ('assigned_at',)
        })
    )


# Coupon Usage Admin
@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ['coupon', 'customer', 'order_amount', 'discount_amount', 'used_at']
    search_fields = ['coupon__code', 'customer__username', 'customer__email']
    list_filter = ['used_at', 'coupon__discount_type']
    readonly_fields = ['used_at']
    
    fieldsets = (
        ('Usage Details', {
            'fields': ('coupon', 'customer', 'order')
        }),
        ('Financial Details', {
            'fields': ('order_amount', 'discount_amount')
        }),
        ('Timestamps', {
            'fields': ('used_at',)
        })
    )


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
admin_site.register(Address, AddressAdmin)
admin_site.register(Coupon, CouponAdmin)
admin_site.register(CustomerCoupon, CustomerCouponAdmin)
admin_site.register(CouponUsage, CouponUsageAdmin)
