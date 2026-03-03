from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Books.models import Book, Category, FavoriteBook

User = get_user_model()

class FavoriteBookTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="favuser",
            email="favuser@example.com",
            phone_number="4444444444",
            password="testpassword",
            role="reader"
        )
        self.category = Category.objects.create(name="Fantasy")
        self.book = Book.objects.create(
            title="Book 1",
            description="Testing favorites",
            author="Author 1",
            is_public=True
        )
        self.book.categories.add(self.category)

        self.list_url = "/api/favorites/"
        self.add_url = "/api/favorites/add/"

    def test_add_favorite_book(self):
        self.client.force_authenticate(user=self.user)
        data = {"book_id": self.book.id}
        response = self.client.post(self.add_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "Book added to favorites")
        self.assertTrue(FavoriteBook.objects.filter(user=self.user, book=self.book).exists())

    def test_add_favorite_book_already_exists(self):
        self.client.force_authenticate(user=self.user)
        FavoriteBook.objects.create(user=self.user, book=self.book)

        data = {"book_id": self.book.id}
        response = self.client.post(self.add_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Book already in favorites")

    def test_add_favorite_book_missing_id(self):
        self.client.force_authenticate(user=self.user)
        data = {}
        response = self.client.post(self.add_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_favorite_books(self):
        self.client.force_authenticate(user=self.user)
        FavoriteBook.objects.create(user=self.user, book=self.book)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Book 1")

    def test_remove_favorite_book(self):
        self.client.force_authenticate(user=self.user)
        FavoriteBook.objects.create(user=self.user, book=self.book)

        remove_url = f"/api/favorites/remove/{self.book.id}/"
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Book removed from favorites")
        self.assertFalse(FavoriteBook.objects.filter(user=self.user, book=self.book).exists())

    def test_remove_favorite_book_not_found(self):
        self.client.force_authenticate(user=self.user)
        remove_url = f"/api/favorites/remove/{self.book.id}/"
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Book not in favorites")
