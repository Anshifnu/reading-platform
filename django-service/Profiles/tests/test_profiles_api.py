from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Profiles.models import UserProfile
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class ProfileTestCases(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="user@example.com",
            phone_number="8882220002",
            password="password",
            role="reader"
        )
        # UserProfile is auto-created by signals upon User creation.

    def test_get_user_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/profile/{self.user.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "testuser")

    def test_get_nonexistent_user_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/profile/9999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_my_profile_json(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "bio": "New bio for test"
        }
        response = self.client.patch("/api/profile/update/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.bio, "New bio for test")

    def test_update_my_profile_multipart(self):
        self.client.force_authenticate(user=self.user)
        gif = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
        image_file = SimpleUploadedFile("avatar.gif", gif, content_type="image/gif")
        data = {
            "bio": "Avatar bio",
            "profile_image": image_file
        }
        response = self.client.patch("/api/profile/update/", data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.bio, "Avatar bio")
