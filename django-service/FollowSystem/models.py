from django.db import models

class FollowRequest(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    )

    follower_id = models.IntegerField()    # reader
    following_id = models.IntegerField()   # author
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower_id", "following_id")



class ReaderWallet(models.Model):
    user_id = models.IntegerField(unique=True)
    balance = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"User {self.user_id} - {self.balance} coins"


class CoinTransaction(models.Model):
    TRANSACTION_TYPE = (
        ("CREDIT", "Credit"),
        ("DEBIT", "Debit"),
    )

    user_id = models.IntegerField()
    amount = models.PositiveIntegerField()
    transaction_type = models.CharField(max_length=6, choices=TRANSACTION_TYPE)
    reason = models.CharField(max_length=50)  # CHAT, ADMIN, REFUND
    created_at = models.DateTimeField(auto_now_add=True)


class AuthorEarning(models.Model):
    author_id = models.IntegerField(unique=True)
    total_earned = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Author {self.author_id} earned {self.total_earned}"


class AuthorEarningTransaction(models.Model):
    author_id = models.IntegerField()
    amount = models.PositiveIntegerField()
    source = models.CharField(max_length=50)  # CHAT
    created_at = models.DateTimeField(auto_now_add=True)
