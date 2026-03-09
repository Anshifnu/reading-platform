import random
import boto3
import json
from django.core.cache import cache
from django.conf import settings

OTP_TTL = 60  # 1 minute

def send_sqs_email(email, subject, message):
    """
    Sends a generic email by placing it onto the AWS SQS Queue.
    The AWS Lambda worker will process this and send it via SES.
    """
    sqs = boto3.client(
        "sqs",
        region_name="ap-south-1",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    
    payload = {
        "email": email,
        "subject": subject,
        "message": message
    }
    
    sqs.send_message(
        QueueUrl=settings.AWS_SQS_QUEUE_URL,
        MessageBody=json.dumps(payload)
    )


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
    subject = "Your Login OTP"
    message = f"Your OTP is {otp}. It expires in 1 minute."
    send_sqs_email(email, subject, message)
