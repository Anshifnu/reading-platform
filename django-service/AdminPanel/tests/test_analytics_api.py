from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from Books.models import Book
from Subscription.models import UserSubscription, SubscriptionPlan
from Feedback.models import BookFeedback

User = get_user_model()

class AdminAnalyticsTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            phone_number="0000000000",
            password="testpassword",
            role="admin",
            is_staff=True,
            is_superuser=True
        )
        self.reader = User.objects.create_user(
            username="readeruser",
            email="reader@example.com",
            phone_number="1111111111",
            password="testpassword",
            role="reader"
        )
        
        # Create some test data for analytics
        self.book = Book.objects.create(
            title="Analytics Book",
            description="Testing analytics",
            summary_text="Analytics book summary",
            author="Analytics Author"
        )
        
        BookFeedback.objects.create(
            user=self.reader,
            book=self.book,
            rating=5,
            comment="Great book!"
        )

        plan = SubscriptionPlan.objects.create(
            name="Monthly Plan",
            plan_type="monthly",
            price=9.99,
            duration_days=30
        )
        
        UserSubscription.objects.create(
            user=self.reader,
            plan=plan,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            is_active=True
        )

    def test_get_analytics_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/analytics/?period=month")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIn("period", response.data)
        self.assertEqual(response.data["period"], "month")
        
        self.assertIn("totals", response.data)
        totals = response.data["totals"]
        self.assertEqual(totals["total_readers"], 1)
        self.assertEqual(totals["total_books"], 1)
        self.assertEqual(totals["active_subs"], 1)
        self.assertEqual(totals["avg_rating"], 5.0)

        self.assertIn("signups", response.data)
        self.assertIn("subscriptions", response.data)
        self.assertIn("books", response.data)
        self.assertIn("rating_distribution", response.data)

    def test_get_analytics_forbidden(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/admin/analytics/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
