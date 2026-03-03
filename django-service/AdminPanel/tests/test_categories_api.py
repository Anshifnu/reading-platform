from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Books.models import Category, CategoryImage

User = get_user_model()

class AdminCategoryManagementTests(APITestCase):

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
        self.category = Category.objects.create(name="Science Fiction")

    def test_list_categories_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming the response has a list of categories under the key "categories"
        self.assertEqual(len(response.data["categories"]), 1)
        self.assertEqual(response.data["categories"][0]["name"], "Science Fiction")

    def test_list_categories_forbidden(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/admin/categories/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_category(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "name": "New Category",
            "image_url": "https://example.com/cat.jpg"
        }
        response = self.client.post("/api/admin/categories/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Category")
        
        category = Category.objects.get(name="New Category")
        self.assertTrue(CategoryImage.objects.filter(category=category, image="https://example.com/cat.jpg").exists())

    def test_create_duplicate_category(self):
        self.client.force_authenticate(user=self.admin)
        data = {"name": "Science Fiction"}
        response = self.client.post("/api/admin/categories/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_category(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "name": "Updated Category",
            "image_url": "https://example.com/newcat.jpg"
        }
        response = self.client.put(f"/api/admin/categories/{self.category.id}/update/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "Updated Category")
        self.assertTrue(CategoryImage.objects.filter(category=self.category, image="https://example.com/newcat.jpg").exists())

    def test_delete_category(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/admin/categories/{self.category.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Category.objects.filter(id=self.category.id).exists())
