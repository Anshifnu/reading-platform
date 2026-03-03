from Subscription.models import UserSubscription, SubscriptionPlan
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()
user = User.objects.first()

# Create or get a plan
plan, _ = SubscriptionPlan.objects.get_or_create(
    name="Test Plan", 
    plan_type="monthly", 
    defaults={"price": 100, "duration_days": 30}
)

# 1. Create a subscription expiring tomorrow (Should trigger Notification)
now = timezone.now()
tomorrow_end = now + timedelta(days=1)

sub_expiring = UserSubscription.objects.create(
    user=user,
    plan=plan,
    start_date=now - timedelta(days=29),
    end_date=tomorrow_end,
    is_active=True
)

print(f"Created expiring subscription: ID {sub_expiring.id}, End Date: {sub_expiring.end_date}")

# 2. Create an expired subscription (Should be deactivated)
expired_end = now - timedelta(minutes=10)

sub_expired = UserSubscription.objects.create(
    user=user,
    plan=plan,
    start_date=now - timedelta(days=31),
    end_date=expired_end,
    is_active=True
)

print(f"Created expired subscription: ID {sub_expired.id}, End Date: {sub_expired.end_date}")
