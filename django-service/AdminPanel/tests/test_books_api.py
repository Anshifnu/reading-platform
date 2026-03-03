from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Books.models import Book, Category, BookImage

User = get_user_model()

class AdminBookManagementTests(APITestCase):

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
        self.category = Category.objects.create(name="Fiction")
        self.book = Book.objects.create(
            title="Existing Book",
            description="A good book",
            summary_text="Summary text",
            author="Author Name",
            publisher="Publisher LLC",
            is_public=True
        )
        self.book.categories.add(self.category)

    def test_list_books_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/books/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_books"], 1)

    def test_list_books_forbidden(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/admin/books/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_book(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "title": "New Admin Book",
            "description": "Created by admin",
            "summary_text": "Summary of new book",
            "author": "Admin Author",
            "category_ids": [self.category.id],
            "image_urls": ["https://example.com/cover.jpg"]
        }
        response = self.client.post("/api/admin/books/create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Admin Book")
        
        book = Book.objects.get(title="New Admin Book")
        self.assertIn(self.category, book.categories.all())
        self.assertTrue(BookImage.objects.filter(book=book, image="https://example.com/cover.jpg").exists())

    def test_update_book(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "title": "Updated Title",
            "description": "Updated description",
            "category_ids": [self.category.id],
            "image_urls": ["https://example.com/newcover.jpg"]
        }
        response = self.client.put(f"/api/admin/books/{self.book.id}/update/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.book.refresh_from_db()
        self.assertEqual(self.book.title, "Updated Title")
        self.assertEqual(self.book.description, "Updated description")
        self.assertTrue(BookImage.objects.filter(book=self.book, image="https://example.com/newcover.jpg").exists())

    def test_delete_book(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/admin/books/{self.book.id}/delete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Book.objects.filter(id=self.book.id).exists())
