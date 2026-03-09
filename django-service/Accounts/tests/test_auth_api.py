from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.cache import cache
from unittest.mock import patch
from django.contrib.auth import get_user_model
import time

User = get_user_model()


class EmailRegisterTests(APITestCase):

    def setUp(self):
        self.url = reverse("register")  

    @patch("Accounts.views.send_sqs_email")
    def test_email_register_success(self, mock_send_sqs_email):

        data = {
            "email": "test@gmail.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "username": "testuser",
            "phone_number": "1234567890",
            "role": "reader"
        }

        response = self.client.post(self.url, data)

        # ✅ 1. Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # ✅ 2. Check response structure
        self.assertIn("registration_id", response.data)

        registration_id = response.data["registration_id"]

        # ✅ 3. Check cache saved
        cached_data = cache.get(registration_id)
        self.assertIsNotNone(cached_data)
        self.assertEqual(cached_data["email"], data["email"])

        # ✅ 4. Check SQS called
        mock_send_sqs_email.assert_called_once()





class VerifyEmailOTPTests(APITestCase):

    def setUp(self):
        self.url = reverse("verify")

        self.registration_id = "12345678-1234-5678-1234-567812345678"

        self.cached_data = {
            "username": "testuser",
            "email": "test@gmail.com",
            "phone_number": "9999999999",
            "password": "StrongPass123",
            "role": "reader",
            "otp": "123456",
            "otp_created_at": time.time(),
            "otp_attempts": 0,
        }

        cache.set(self.registration_id, self.cached_data)

    # ✅ SUCCESS CASE
    @patch("Accounts.views.RefreshToken.for_user")
    def test_verify_email_otp_success(self, mock_refresh):

        mock_refresh.return_value.access_token = "access_token"
        mock_refresh.return_value.__str__ = lambda x: "refresh_token"

        data = {
            "registration_id": self.registration_id,
            "otp": "123456"
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="test@gmail.com").exists())

        # cache should be deleted
        self.assertIsNone(cache.get(self.registration_id))


    # ❌ SESSION EXPIRED
    def test_session_expired(self):

        cache.delete(self.registration_id)

        data = {
            "registration_id": self.registration_id,
            "otp": "123456"
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Registration session expired")


    # ❌ OTP EXPIRED
    def test_otp_expired(self):

        expired_data = self.cached_data
        expired_data["otp_created_at"] = time.time() - 100  # older than 30 sec

        cache.set(self.registration_id, expired_data)

        data = {
            "registration_id": self.registration_id,
            "otp": "123456"
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "OTP expired")


    # ❌ INVALID OTP
    def test_invalid_otp(self):

        data = {
            "registration_id": self.registration_id,
            "otp": "000000"
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid OTP")

        updated_cache = cache.get(self.registration_id)
        self.assertEqual(updated_cache["otp_attempts"], 1)


    # ❌ MAX ATTEMPTS
    def test_max_attempts(self):

        max_attempt_data = self.cached_data
        max_attempt_data["otp_attempts"] = 3

        cache.set(self.registration_id, max_attempt_data)

        data = {
            "registration_id": self.registration_id,
            "otp": "123456"
        }

        response = self.client.post(self.url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"],
            "Too many invalid attempts. Please register again."
        )

        self.assertIsNone(cache.get(self.registration_id))


class ResendEmailOTPTests(APITestCase):

    def setUp(self):
        self.url = "/api/resend-email-otp/"
        self.registration_id = "12345678-1234-5678-1234-567812345678"

        self.cached_data = {
            "email": "test@gmail.com",
            "resend_count": 0
        }

    @patch("Accounts.views.send_sqs_email")
    def test_resend_email_otp_success(self, mock_send_sqs_email):
        cache.set(self.registration_id, self.cached_data, timeout=300)

        data = {
            "registration_id": self.registration_id
        }

        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "OTP resent successfully")

        # Check resend count increased
        updated_cache = cache.get(self.registration_id)
        self.assertEqual(updated_cache["resend_count"], 1)

        mock_send_sqs_email.assert_called_once()


    def test_resend_email_otp_limit_exceeded(self):
        max_resend_data = self.cached_data
        max_resend_data["resend_count"] = 3
        cache.set(self.registration_id, max_resend_data, timeout=300)

        data = {
            "registration_id": self.registration_id
        }

        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Resend limit exceeded")
