# settings.py

import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Tải biến môi trường từ file .env
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-default-key-for-development-only")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

# Allow all hosts in production (you may want to restrict this later)
ALLOWED_HOSTS = ['*']

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'api',
    'ckeditor',
    'ckeditor_uploader',
    'oauth2_provider',
    'cloudinary',
    'cloudinary_storage',
    'drf_yasg',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django.contrib.sites',
]

SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'allauth.account.middleware.AccountMiddleware',
]
ROOT_URLCONF = 'fashion_store.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            # Thêm thư mục mẫu của bạn nếu cần
            BASE_DIR / 'templates',  # Ví dụ, nếu bạn có thư mục templates ở thư mục gốc của dự án
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


WSGI_APPLICATION = 'fashion_store.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv("DB_NAME"),
        'USER': os.getenv("DB_USER"),
        'PASSWORD': os.getenv("DB_PASSWORD"),
        'HOST': os.getenv("DB_HOST"),
    }
}

# If DATABASE_URL is provided (Railway's default), use it
if 'DATABASE_URL' in os.environ:
    import dj_database_url
    db_from_env = dj_database_url.config(
        conn_max_age=500,
        conn_health_checks=True,
    )
    DATABASES['default'].update(db_from_env)

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Custom User Model
AUTH_USER_MODEL = 'api.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 2,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oauth2_provider.contrib.rest_framework.OAuth2Authentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    )
}

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CKEditor Configuration
CKEDITOR_UPLOAD_PATH = "fashionStore/images"

# Cloudinary Configuration
import cloudinary
import cloudinary.uploader
import cloudinary.api

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "ddoebyozj"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "277385837862538"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "T9Hzhi-HFkb8lO5OW5NmmgUE2kA")
)

# Kiểm tra nếu đang chạy trên Railway thì sử dụng Cloudinary storage
if 'RAILWAY_STATIC_URL' in os.environ:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://accounts.google.com",
]

# Disable CORS_ALLOW_ALL_ORIGINS if CORS_ALLOWED_ORIGINS is specified
CORS_ALLOW_ALL_ORIGINS = False

# Allow credentials for Google OAuth
CORS_ALLOW_CREDENTIALS = True

# Additional CORS settings for Google Sign-In
CORS_ALLOW_ALL_HEADERS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Update ALLOWED_HOSTS for Railway deployment
ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '8531-2001-ee0-4f02-5180-759d-c770-f8c8-8ff0.ngrok-free.app',  # Thay bằng URL Ngrok của bạn
]

# Add Railway domains to ALLOWED_HOSTS
railway_url = os.environ.get('RAILWAY_STATIC_URL')
if railway_url:
    ALLOWED_HOSTS.append(railway_url.split('//')[1])

# Add CORS origins for Railway
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://accounts.google.com",
]

# Add Railway frontend URL to CORS origins
if railway_url:
    CORS_ALLOWED_ORIGINS.append(railway_url)

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    # 'allauth.account.auth_backends.AuthenticationBackend',
]

# OAuth2 Provider Configuration
OAUTH2_PROVIDER = {
    'ACCESS_TOKEN_EXPIRE_SECONDS': 36000,  # 10 giờ
    'REFRESH_TOKEN_EXPIRE_SECONDS': 86400,  # 1 ngày
    'AUTHORIZATION_CODE_EXPIRE_SECONDS': 600,  # 10 phút
    'CLIENT_SECRET_GENERATOR_LENGTH': 50,
    'SCOPES': {'read': 'Read scope', 'write': 'Write scope'},
    'PKCE_REQUIRED': False,  # Đặt True nếu sử dụng PKCE
}

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
GOOGLE_CLIENT_ID = '26813504372-gppk46aam6s85p46th052u4uujmmp6g2.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# VNPay configuration
VNPAY_TMN_CODE = 'GMD8US5K'
VNPAY_HASH_SECRET_KEY = 'MFHLIN0QCOVF9ZW1UVB0WI7NVTZ0DYH5'
VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
VNPAY_RETURN_URL = 'http://127.0.0.1:8000/vnpay/payment_return/'  # Thay thế bằng URL của bạn


# settings.py
PAYPAL_CLIENT_ID = 'ASYyhk4BYq1XciVddBhfKgs1kPh3xOIyNWvjyTOdKPU-kdP47bu4G3OnF-3H4aMgnqRjNm_A2fr6kspW'
PAYPAL_CLIENT_SECRET = 'EOoskqyFtjQjjiUnBo4kAMk_Xl9G7jVqaHsnoDwJzJ0SQze4SGi0kd96toD-8mt9ssZjnJdMxn7hVym1'
PAYPAL_MODE = 'sandbox' # Or 'live' for production

SITE_ID = 1  # rất quan trọng cho allauth
LOGIN_REDIRECT_URL = "/"  # hoặc /dashboard, tùy bạn muốn redirect sau khi login
LOGOUT_REDIRECT_URL = "/"  # nơi redirect sau khi logout

# Email Configuration - SMTP chuẩn cho Gmail (sửa lỗi SSL)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587  # Port chuẩn cho TLS
EMAIL_USE_TLS = True  # Sử dụng TLS
EMAIL_USE_SSL = False  # Không dùng SSL
EMAIL_HOST_USER = 'liemhuy512@gmail.com'
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD')  # App password
EMAIL_TIMEOUT = 60
DEFAULT_FROM_EMAIL = 'Fashion Store <liemhuy512@gmail.com>'