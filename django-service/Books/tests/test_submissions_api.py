from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Books.models import Book, Category, BookSubmission
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch

User = get_user_model()

class BookSubmissionTests(APITestCase):

    def setUp(self):
        self.author = User.objects.create_user(
            username="testauthor",
            email="author@example.com",
            phone_number="5555555555",
            password="testpassword",
            role="author"
        )
        self.admin = User.objects.create_user(
            username="testadmin",
            email="admin@example.com",
            phone_number="6666666666",
            password="testpassword",
            role="admin",
            is_superuser=True,
            is_staff=True
        )

        self.submission = BookSubmission.objects.create(
            title="My First Submission",
            submitter=self.author,
            author="John Writer",
            description="A very long descriptive text.",
            pdf_file="https://example.com/dummy.pdf",
            status="pending"
        )

    def test_author_create_submission(self):
        self.client.force_authenticate(user=self.author)
        url = "/api/submissions/"

        data = {
            "title": "A New Book",
            "author": "Jane Author",
            "description": "Another test description",
            "pdf_file": "https://example.com/dummy2.pdf",
            "publisher": "Test Publishing LLC",
            "summary_text": "A brief summary."
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "A New Book")
        self.assertEqual(response.data["status"], "pending")

    def test_author_list_own_submissions(self):
        self.client.force_authenticate(user=self.author)
        url = "/api/submissions/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming no pagination, it returns list directly
        self.assertEqual(len(response.data["results"] if "results" in response.data else response.data), 1)

    def test_admin_list_submissions(self):
        self.client.force_authenticate(user=self.admin)
        url = "/api/admin/submissions/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"] if "results" in response.data else response.data), 1)

    def test_reject_submission(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/api/admin/submissions/{self.submission.id}/reject/"
        
        response = self.client.post(url, {"feedback": "Not enough pages"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Submission rejected.")
        
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, "rejected")
        self.assertEqual(self.submission.admin_feedback, "Not enough pages")

    @patch("Books.utils.ai_verifier.AIVerifier.verify_submission")
    def test_verify_submission(self, mock_verifier):
        self.client.force_authenticate(user=self.admin)
        url = f"/api/admin/submissions/{self.submission.id}/verify/"

        mock_verifier.return_value = {
            "duplicate": False,
            "plagiarism_score": 0.0,
            "feedback": "Looks perfectly original."
        }

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, "verified")

    def test_approve_submission(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/api/admin/submissions/{self.submission.id}/approve/"
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "Book Approved and Published!")
        
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, "approved")
        
        # Check newly spawned Book
        self.assertTrue(Book.objects.filter(title="My First Submission").exists())
