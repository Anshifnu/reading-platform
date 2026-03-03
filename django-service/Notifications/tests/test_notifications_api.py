import unittest
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Notifications.models import Notification, DeviceToken

User = get_user_model()

class NotificationTestCases(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="user@example.com",
            phone_number="8882220001",
            password="password",
            role="reader"
        )
        self.notification = Notification.objects.create(
            user=self.user,
            type="TEST_TYPE",
            title="Test Title",
            message="Test Message"
        )

    def test_notification_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Test Title")

    def test_notification_list_unauthenticated(self):
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_notification_read(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/notifications/{self.notification.id}/read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_notification_read_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/notifications/9999/read/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deactivate_notification(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/notifications/{self.notification.id}/remove/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertFalse(self.notification.is_active)

    def test_deactivate_notification_not_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/notifications/9999/remove/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_save_device_token(self):
        # The view tests for serialization and save
        self.client.force_authenticate(user=self.user)
        data = {"token": "test_device_token_xyz"}
        response = self.client.post("/api/save-device-token/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(DeviceToken.objects.filter(user=self.user, token="test_device_token_xyz").exists())

    def test_save_device_token_invalid(self):
        self.client.force_authenticate(user=self.user)
        data = {"wrong_key": "test_device_token_xyz"}
        response = self.client.post("/api/save-device-token/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
