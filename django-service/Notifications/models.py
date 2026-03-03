from django.db import models
from django.conf import settings

# notifications/models.py
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("SUB_EXPIRING", "Subscription Expiring"),
        ("SUB_EXPIRED", "Subscription Expired"),
        ("SUB_RENEWED", "Subscription Renewed"),
        ("COINS_ADDED", "Coins Added"),
        ("NEW_POST", "New Post"),
        ("ROLE_CHANGED", "Role Changed"),
        ("ACCOUNT_BLOCKED", "Account Blocked"),
        ("BOOK_APPROVED", "Book Submission Approved"),
        ("BOOK_REJECTED", "Book Submission Rejected"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()

    is_read = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)  # 👈 IMPORTANT

    related_object_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)



class DeviceToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.TextField(unique=True)  # important
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.token}"
