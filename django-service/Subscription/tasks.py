from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import UserSubscription
from Notifications.models import Notification  # 👈 IMPORT HERE

User = get_user_model()
from Accounts.utils import send_sqs_email

@shared_task
def handle_subscription_expiry():
    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)

    # 🔔 SUBSCRIPTION EXPIRING TOMORROW
    expiring_tomorrow = UserSubscription.objects.filter(
        end_date__date=tomorrow,
        is_active=True
    )

    for sub in expiring_tomorrow:
        user = sub.user

        # 👉 CREATE SITE NOTIFICATION
        Notification.objects.create(
            user=user,
            type="SUB_EXPIRING",
            title="Subscription expiring soon",
            message="Your subscription will expire tomorrow. Renew now to avoid interruption."
        )

        subject = "⏰ Your subscription expires tomorrow"
        body = (
            f"Hi {user.username},\n\n"
            "Your subscription will expire tomorrow.\n"
            "Renew now to avoid losing access.\n\n"
            "— BookSphere Team"
        )
        send_sqs_email(user.email, subject, body)
    # ❌ SUBSCRIPTION EXPIRED
    expired_subs = UserSubscription.objects.filter(
        end_date__lt=timezone.now(),
        is_active=True
    )

    for sub in expired_subs:
        user = sub.user

        sub.is_active = False
        sub.save(update_fields=["is_active"])

        user.has_permission = False
        user.save(update_fields=["has_permission"])

        # 👉 CREATE SITE NOTIFICATION
        Notification.objects.create(
            user=user,
            type="SUB_EXPIRED",
            title="Subscription expired",
            message="Your subscription has expired. Renew to regain access."
        )

        subject = "❌ Subscription expired"
        body = (
            f"Hi {user.username},\n\n"
            "Your subscription has expired.\n"
            "Please renew to continue enjoying premium features.\n\n"
            "— BookSphere Team"
        )
        send_sqs_email(user.email, subject, body)

