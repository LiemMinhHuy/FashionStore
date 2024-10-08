# forms.py
from django import forms

class PaymentForm(forms.Form):
    ORDER_TYPE_CHOICES = [
        ('billpayment', 'Thanh toán hóa đơn'),
        ('other', 'Loại khác'),  # Thêm các loại khác nếu cần
    ]

    order_type = forms.ChoiceField(choices=ORDER_TYPE_CHOICES)
    order_id = forms.CharField(max_length=100)
    amount = forms.DecimalField(decimal_places=2, min_value=0.01)  # Đảm bảo số tiền lớn hơn 0
    order_desc = forms.CharField(max_length=255)
    bank_code = forms.CharField(max_length=10, required=False)
    language = forms.CharField(max_length=5, required=False, initial='vn')  # Mặc định là 'vn'
