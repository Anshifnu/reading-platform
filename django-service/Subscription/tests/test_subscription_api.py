from unittest.mock import patch, MagicMock
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Subscription.models import SubscriptionPlan, UserSubscription
from FollowSystem.models import ReaderWallet

User = get_user_model()

class SubscriptionTestCases(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="user@example.com",
            phone_number="8882220003",
            password="password",
            role="reader"
        )
        self.plan_monthly = SubscriptionPlan.objects.create(
            name="Monthly Sub",
            plan_type="monthly",
            price=19,
            duration_days=30,
            is_active=True
        )
        self.plan_yearly = SubscriptionPlan.objects.create(
            name="Yearly Sub",
            plan_type="yearly",
            price=199,
            duration_days=365,
            is_active=True
        )

    def test_subscription_plan_list(self):
        response = self.client.get("/api/subscriptions/plans/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    @patch('Subscription.views.client.order.create')
    def test_create_subscription_order(self, mock_razorpay):
        mock_razorpay.return_value = {"id": "order_xyz123"}
        self.client.force_authenticate(user=self.user)
        
        data = {"plan_type": "monthly"}
        response = self.client.post("/api/subscriptions/create-order/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_id"], "order_xyz123")

    @patch('Subscription.views.client.utility.verify_payment_signature')
    def test_verify_subscription_payment(self, mock_verify):
        mock_verify.return_value = True
        self.client.force_authenticate(user=self.user)

        data = {
            "razorpay_payment_id": "pay_xyz",
            "razorpay_order_id": "order_xyz",
            "plan_type": "monthly"
        }
        response = self.client.post("/api/subscriptions/verify/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        wallet = ReaderWallet.objects.get(user_id=self.user.id)
        self.assertEqual(wallet.balance, 100) # Monthly plan adds 100 coins
        self.assertTrue(UserSubscription.objects.filter(user=self.user, is_active=True).exists())

    def test_get_user_subscription_status_none(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/subscriptions/status/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["active_plan"])

    def test_get_user_subscription_status_active(self):
        UserSubscription.objects.create(
            user=self.user,
            plan=self.plan_yearly,
            razorpay_payment_id="pay_123",
            razorpay_order_id="order_123"
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/subscriptions/status/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_plan"]["plan_type"], "yearly")

    @patch('Subscription.views.client.order.create')
    def test_add_coin_order(self, mock_create):
        mock_create.return_value = {"id": "order_coin"}
        self.client.force_authenticate(user=self.user)
        data = {"plan": "500_COINS"}
        response = self.client.post("/api/wallet/add-coins/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["coins"], 500)

    @patch('Subscription.views.client.utility.verify_payment_signature')
    def test_verify_coin_payment(self, mock_verify):
        mock_verify.return_value = True
        self.client.force_authenticate(user=self.user)
        
        data = {
            "razorpay_order_id": "order_123",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "sig_123",
            "coins": 500
        }
        
        response = self.client.post("/api/wallet/verify-coins/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        wallet = ReaderWallet.objects.get(user_id=self.user.id)
        self.assertEqual(wallet.balance, 500)
