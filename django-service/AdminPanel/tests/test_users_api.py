from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Notifications.models import Notification
from django.core import mail

User = get_user_model()

class AdminUserManagementTests(APITestCase):

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
        self.author = User.objects.create_user(
            username="authoruser",
            email="author@example.com",
            phone_number="2222222222",
            password="testpassword",
            role="author"
        )

    def test_list_users_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("counts", response.data)
        self.assertIn("users", response.data)
        self.assertEqual(response.data["counts"]["total_users"], 2)

    def test_list_users_as_non_admin(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_block_user(self):
        mail.outbox.clear()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/admin/users/{self.reader.id}/block/", {"block": True, "reason": "Spamming"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_active"])
        
        self.reader.refresh_from_db()
        self.assertFalse(self.reader.is_active)
        
        # Check notification
        self.assertTrue(Notification.objects.filter(user=self.reader, type="ACCOUNT_BLOCKED").exists())
        # Check email
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Suspended", mail.outbox[0].subject)

    def test_unblock_user(self):
        self.reader.is_active = False
        self.reader.save()

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/admin/users/{self.reader.id}/block/", {"block": False, "reason": "Appealed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_active"])
        
        self.reader.refresh_from_db()
        self.assertTrue(self.reader.is_active)

    def test_change_user_role(self):
        mail.outbox.clear()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/admin/users/{self.reader.id}/change-role/", {"new_role": "author", "reason": "Requested"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["new_role"], "author")
        
        self.reader.refresh_from_db()
        self.assertEqual(self.reader.role, "author")
        
        # Check notification
        self.assertTrue(Notification.objects.filter(user=self.reader, type="ROLE_CHANGED").exists())
        # Check email
        self.assertEqual(len(mail.outbox), 1)

    def test_change_role_invalid(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/admin/users/{self.reader.id}/change-role/", {"new_role": "superadmin"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
