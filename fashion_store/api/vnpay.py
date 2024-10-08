import hashlib
import urllib.parse
import logging

logger = logging.getLogger(__name__)

class vnpay:
    def __init__(self, secret_key):
        self.secret_key = secret_key
        self.params = {}

    def add_param(self, key, value):
        """Thêm tham số vào danh sách tham số."""
        self.params[key] = value

    def create_secure_hash(self):
        """Tạo chữ ký SHA256 cho các tham số."""
        # Sắp xếp các tham số theo tên khóa tăng dần
        sorted_params = sorted(self.params.items())
        data_string = '&'.join([f"{key}={value}" for key, value in sorted_params])
        logger.debug(f"Data string for hashing: {data_string}")

        # Thêm khóa bí mật vào cuối chuỗi
        hash_data = f"{data_string}&{self.secret_key}".encode('utf-8')
        logger.debug(f"Hash data string: {hash_data}")

        # Tạo chữ ký SHA256
        secure_hash = hashlib.sha256(hash_data).hexdigest().upper()
        logger.debug(f"Generated Secure Hash: {secure_hash}")

        return secure_hash

    def get_payment_url(self, base_url):
        """Tạo URL thanh toán với chữ ký."""
        secure_hash = self.create_secure_hash()
        encoded_params = urllib.parse.urlencode(self.params)
        payment_url = f"{base_url}?{encoded_params}&vnp_SecureHash={secure_hash}"
        logger.debug(f"Generated Payment URL: {payment_url}")
        return payment_url

    def validate_response(self, response_data):
        """Xác thực chữ ký từ phản hồi của VNPAY."""
        secure_hash = response_data.get('vnp_SecureHash')
        if not secure_hash:
            return False

        # Xóa chữ ký ra khỏi các tham số để tạo lại chữ ký
        response_data.pop('vnp_SecureHash', None)
        self.params = response_data  # Cập nhật params với dữ liệu phản hồi

        # Tạo chữ ký mới từ các tham số đã nhận
        computed_hash = self.create_secure_hash()
        is_valid = computed_hash == secure_hash
        logger.debug(f"Response is valid: {is_valid}")
        return is_valid
