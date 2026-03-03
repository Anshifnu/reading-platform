import random
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

OTP_TTL = 60  # 1 minute


def generate_otp():
    return str(random.randint(100000, 999999))


def cache_key(email):
    return f"login_otp:{email}"


def store_otp(email, otp):
    cache.set(cache_key(email), otp, timeout=OTP_TTL)


def get_otp(email):
    return cache.get(cache_key(email))


def delete_otp(email):
    cache.delete(cache_key(email))


def send_otp_email(email, otp):
    send_mail(
        subject="Your Login OTP",
        message=f"Your OTP is {otp}. It expires in 1 minute.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
