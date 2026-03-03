from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.cache import cache
from unittest.mock import patch
from django.contrib.auth import get_user_model

User = get_user_model()


class ForgotPasswordTests(APITestCase):

    def setUp(self):
        self.forgot_url = "/api/forgot-password/"
        self.verify_url = "/api/verify-forgot-otp/"
        self.reset_url = "/api/reset-password/"

        self.user = User.objects.create_user(
            username="forgotuser",
            email="forgot@gmail.com",
            password="OldPassword123"
        )

    # ✅ 1. Forgot Password Request
    @patch("Accounts.views.send_mail")
    def test_forgot_password_success(self, mock_send_mail):
        response = self.client.post(self.forgot_url, {"email": self.user.email})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("reset_token", response.data)
        
        reset_token = response.data["reset_token"]
        self.assertIsNotNone(cache.get(f"fp_otp_{reset_token}"))
        self.assertEqual(cache.get(f"fp_email_{reset_token}"), self.user.email)
        mock_send_mail.assert_called_once()

    def test_forgot_password_unregistered(self):
        response = self.client.post(self.forgot_url, {"email": "unknown@gmail.com"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    # ✅ 2. Verify Forgot Password OTP
    def test_verify_forgot_otp_success(self):
        reset_token = "mock-reset-token"
        cache.set(f"fp_otp_{reset_token}", "123456", timeout=300)
        cache.set(f"fp_email_{reset_token}", self.user.email, timeout=600)

        data = {
            "reset_token": reset_token,
            "otp": "123456"
        }
        response = self.client.post(self.verify_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify it set the validated status in cache
        self.assertTrue(cache.get(f"fp_verified_{reset_token}"))

    def test_verify_forgot_otp_invalid(self):
        reset_token = "mock-reset-token"
        cache.set(f"fp_otp_{reset_token}", "123456", timeout=300)

        response = self.client.post(self.verify_url, {"reset_token": reset_token, "otp": "000000"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid OTP")


    # ✅ 3. Reset Password Final Step
    def test_reset_password_success(self):
        reset_token = "mock-reset-token"
        cache.set(f"fp_verified_{reset_token}", True, timeout=300)
        cache.set(f"fp_email_{reset_token}", self.user.email, timeout=600)

        data = {
            "reset_token": reset_token,
            "new_password": "NewStrongPassword123",
            "confirm_password": "NewStrongPassword123"
        }

        response = self.client.post(self.reset_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password reset successful")

        # Test user password changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPassword123"))

        # Test cache cleared
        self.assertIsNone(cache.get(f"fp_email_{reset_token}"))
        self.assertIsNone(cache.get(f"fp_verified_{reset_token}"))

    def test_reset_password_mismatch(self):
        data = {
            "reset_token": "mock-reset-token",
            "new_password": "Password1",
            "confirm_password": "Password2"
        }
        response = self.client.post(self.reset_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Passwords do not match")
