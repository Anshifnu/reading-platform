from django.urls import path, reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.cache import cache
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import time

User = get_user_model()


class LoginTests(APITestCase):

    def setUp(self):
        self.login_url = "/api/login/"
        self.verify_url = "/api/verify-otp/"
        self.logout_url = "/api/logout/"

        # Setup an active user
        self.user_pass = "StrongUser123"
        self.user = User.objects.create_user(
            username="loginuser",
            email="login@gmail.com",
            phone_number="1231231234",
            password=self.user_pass,
            role="reader",
            is_email_verified=True,
            is_active=True
        )

    # ✅ SUCCESS LOGIN (Sends OTP)
    @patch("Accounts.views.send_otp_email")
    def test_login_success(self, mock_send_email):
        data = {
            "email": "login@gmail.com",
            "password": self.user_pass
        }

        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "OTP sent to email")
        
        mock_send_email.assert_called_once()
        # Verify OTP is stored in Redis
        stored_otp = cache.get(f"login_otp:login@gmail.com")
        self.assertIsNotNone(stored_otp)

    # ❌ FAILED LOGIN (Wrong Password)
    def test_login_invalid_credentials(self):
        data = {
            "email": "login@gmail.com",
            "password": "WrongPassword!"
        }

        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("message", response.data)


class OTPVerifyLoginTests(APITestCase):

    def setUp(self):
        self.verify_url = "/api/verify-otp/"

        self.user_pass = "StrongUser123"
        self.user = User.objects.create_user(
            username="verifyuser",
            email="verify@gmail.com",
            phone_number="9879879870",
            password=self.user_pass,
            role="reader",
            is_email_verified=True,
            is_active=True
        )

        self.otp = "654321"
        cache.set(f"login_otp:{self.user.email}", self.otp, timeout=300)

    # ✅ SUCCESS OTP VERIFY
    @patch("Accounts.views.RefreshToken.for_user")
    def test_login_otp_verify_success(self, mock_refresh):
        mock_refresh.return_value.access_token = "access_token"
        mock_refresh.return_value.__str__ = lambda x: "refresh_token"

        data = {
            "email": self.user.email,
            "otp": self.otp
        }

        response = self.client.post(self.verify_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Login successful")
        self.assertIn("tokens", response.data)

        # Ensure OTP is deleted after successful login
        self.assertIsNone(cache.get(f"login_otp:{self.user.email}"))

    # ❌ FAILED OTP VERIFY
    def test_login_otp_verify_invalid(self):
        data = {
            "email": self.user.email,
            "otp": "000000"
        }

        response = self.client.post(self.verify_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutTests(APITestCase):

    def setUp(self):
        self.logout_url = "/api/logout/"
        self.user = User.objects.create_user(
            username="logoutuser",
            email="logout@gmail.com",
            password="Password123",
        )
        self.refresh_token = RefreshToken.for_user(self.user)

    def test_logout_success(self):
        data = {
            "refresh": str(self.refresh_token)
        }
        response = self.client.post(self.logout_url, data)
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertEqual(response.data["message"], "Logout successful")

    def test_logout_missing_token(self):
        response = self.client.post(self.logout_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GoogleLoginTests(APITestCase):

    @patch("Accounts.views.id_token.verify_oauth2_token")
    @patch("Accounts.views.RefreshToken.for_user")
    def test_google_login_success(self, mock_refresh, mock_verify):
        self.google_url = "/api/google-login/"
        
        mock_verify.return_value = {
            "email": "googleuser@gmail.com",
            "name": "Google User"
        }
        
        mock_refresh.return_value.access_token = "access_token"
        mock_refresh.return_value.__str__ = lambda x: "refresh_token"

        response = self.client.post(self.google_url, {"token": "valid_mock_token"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)
        self.assertEqual(response.data["user"]["email"], "googleuser@gmail.com")

    @patch("Accounts.views.id_token.verify_oauth2_token")
    def test_google_login_invalid(self, mock_verify):
        self.google_url = "/api/google-login/"
        
        mock_verify.side_effect = ValueError("Invalid token")

        response = self.client.post(self.google_url, {"token": "invalid_mock_token"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid token")
