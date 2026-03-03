from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from FollowSystem.models import FollowRequest, ReaderWallet, CoinTransaction, AuthorEarning, AuthorEarningTransaction

User = get_user_model()

class FollowSystemTestCases(APITestCase):

    def setUp(self):
        self.reader = User.objects.create_user(
            username="testreader",
            email="reader@example.com",
            phone_number="9991110001",
            password="password",
            role="reader"
        )
        self.author = User.objects.create_user(
            username="testauthor",
            email="author@example.com",
            phone_number="9991110002",
            password="password",
            role="author"
        )
        self.admin = User.objects.create_user(
            username="testadmin",
            email="admin@example.com",
            phone_number="9991110003",
            password="password",
            role="admin",
            is_staff=True,
            is_superuser=True
        )

    def test_send_follow_request(self):
        self.client.force_authenticate(user=self.reader)
        data = {"following_id": self.author.id}
        response = self.client.post("/api/follow-request/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check DB
        follow = FollowRequest.objects.get(follower_id=self.reader.id, following_id=self.author.id)
        self.assertEqual(follow.status, "PENDING")

    def test_send_follow_request_self(self):
        self.client.force_authenticate(user=self.author)
        data = {"following_id": self.author.id}
        response = self.client.post("/api/follow-request/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_send_follow_admin_role(self):
        self.client.force_authenticate(user=self.admin)
        data = {"following_id": self.author.id}
        response = self.client.post("/api/follow-request/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_respond_follow_request(self):
        follow = FollowRequest.objects.create(follower_id=self.reader.id, following_id=self.author.id, status="PENDING")
        self.client.force_authenticate(user=self.author)
        data = {"follow_id": follow.id, "action": "ACCEPT"}
        response = self.client.post("/api/follow-respond/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ACCEPTED")

    def test_get_pending_requests(self):
        FollowRequest.objects.create(follower_id=self.reader.id, following_id=self.author.id, status="PENDING")
        self.client.force_authenticate(user=self.author)
        response = self.client.get("/api/follow-requests/pending/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_my_following(self):
        FollowRequest.objects.create(follower_id=self.reader.id, following_id=self.author.id, status="ACCEPTED")
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/my-following/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.author.id, response.data)

    def test_my_pending_requests(self):
        FollowRequest.objects.create(follower_id=self.reader.id, following_id=self.author.id, status="PENDING")
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/my-pending-requests/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.author.id, response.data)

    def test_follow_status(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get(f"/api/status/?author_id={self.author.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "NOT_ALLOWED")

    def test_deduct_coins(self):
        wallet = ReaderWallet.objects.get(user_id=self.reader.id)
        wallet.balance = 50
        wallet.save()
        self.client.force_authenticate(user=self.reader)
        data = {"amount": 10, "author_id": self.author.id}
        response = self.client.post("/api/coins/deduct/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        wallet.refresh_from_db()
        self.assertEqual(wallet.balance, 40)
        
        earning = AuthorEarning.objects.get(author_id=self.author.id)
        self.assertEqual(earning.total_earned, 10)

    def test_deduct_coins_insufficient(self):
        wallet = ReaderWallet.objects.get(user_id=self.reader.id)
        wallet.balance = 5
        wallet.save()
        self.client.force_authenticate(user=self.reader)
        data = {"amount": 10, "author_id": self.author.id}
        response = self.client.post("/api/coins/deduct/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_followers_count(self):
        FollowRequest.objects.create(follower_id=self.reader.id, following_id=self.author.id, status="ACCEPTED")
        response = self.client.get(f"/api/followers-count/{self.author.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["followers"], 1)

    def test_following_count(self):
        FollowRequest.objects.create(follower_id=self.reader.id, following_id=self.author.id, status="ACCEPTED")
        response = self.client.get(f"/api/following-count/{self.reader.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["following"], 1)
