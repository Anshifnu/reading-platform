from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Books.models import Book, Category, BookImage
from unittest.mock import patch

User = get_user_model()

class BookCoreTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            phone_number="1111111111",
            password="testpassword",
            role="reader"
        )
        self.category = Category.objects.create(name="Fiction")
        self.book = Book.objects.create(
            title="A Great Book",
            description="Testing books",
            author="John Doe",
            is_public=True
        )
        self.book.categories.add(self.category)

    def test_list_books_public(self):
        url = "/api/books/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain at least our 1 public book depending on pagination
        self.assertIn("results", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_get_book_detail_public(self):
        url = f"/api/books/{self.book.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "A Great Book")


class CategoryTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Science")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            phone_number="1111111111",
            password="testpassword",
            role="reader"
        )

    def test_category_list_public(self):
        url = "/api/categories/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_category_check_exists_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = "/api/categories/check/?name=Science"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["exists"])

    def test_category_check_not_exists_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = "/api/categories/check/?name=UnknownCategory"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["exists"])

    def test_category_check_unauthenticated(self):
        url = "/api/categories/check/?name=Science"
        response = self.client.get(url)
        # CategoryCheckView has permission_classes = [IsAuthenticated]
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TranslateTextTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            phone_number="1111111111",
            password="testpassword",
            role="reader"
        )
        self.url = "/api/translate/"

    @patch("Books.views.requests.post")
    def test_translate_text_success(self, mock_post):
        self.client.force_authenticate(user=self.user)
        
        # Mocking google api response
        mock_response = mock_post.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": {
                "translations": [
                    {"translatedText": "Hola Mundo"}
                ]
            }
        }

        data = {"text": "Hello World", "target": "es"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["translatedText"], "Hola Mundo")

    def test_translate_text_missing_params(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {"text": "Hello"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
