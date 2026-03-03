from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Authors.models import AuthorsWork
from Profiles.models import UserProfile
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class AuthorsTestCases(APITestCase):

    def setUp(self):
        self.reader = User.objects.create_user(
            username="testreader",
            email="reader@example.com",
            phone_number="7771110001",
            password="password",
            role="reader"
        )
        self.author = User.objects.create_user(
            username="testauthor",
            email="author@example.com",
            phone_number="7771110002",
            password="password",
            role="author"
        )
        # UserProfile is created via Django signals automatically.

        self.work = AuthorsWork.objects.create(
            author=self.author,
            title="My First Work",
            summary="A test summary",
            category="Fiction",
            content="<p>Test HTML content</p>",
            image="test_image.jpg"
        )

    def test_author_listing(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get("/api/authors/listing/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "testauthor")

    def test_authors_work_create_as_author(self):
        self.client.force_authenticate(user=self.author)
        gif = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
        image_file = SimpleUploadedFile("test_image.gif", gif, content_type="image/gif")
        data = {
            "title": "New Piece",
            "summary": "Piece summary",
            "category": "Non-Fiction",
            "content": "<h1>HTML text</h1>",
            "image": image_file
        }
        response = self.client.post("/api/authors/work-create/", data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Piece")

    def test_authors_work_create_as_reader(self):
        self.client.force_authenticate(user=self.reader)
        data = {"title": "Reader Piece"}
        response = self.client.post("/api/authors/work-create/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authors_work_list(self):
        response = self.client.get("/api/authors/work-list/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My First Work")

    def test_authors_work_detail(self):
        self.client.force_authenticate(user=self.reader)
        response = self.client.get(f"/api/authors/work/{self.work.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "My First Work")

    def test_authors_work_update(self):
        self.client.force_authenticate(user=self.author)
        data = {"title": "Updated Title"}
        response = self.client.put(f"/api/authors/work/{self.work.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")

    def test_authors_work_update_wrong_author(self):
        wrong_author = User.objects.create_user(
            username="wrongauthor",
            email="wrong@example.com",
            phone_number="7771110003",
            password="password",
            role="author"
        )
        self.client.force_authenticate(user=wrong_author)
        data = {"title": "Hacked Title"}
        response = self.client.put(f"/api/authors/work/{self.work.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_my_works_list(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.get("/api/authors/my-works/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My First Work")
