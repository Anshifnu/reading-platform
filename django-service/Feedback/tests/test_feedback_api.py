from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from Feedback.models import SiteFeedback, BookFeedback
from Books.models import Book

User = get_user_model()

class FeedbackTestCases(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            phone_number="8881110001",
            password="password",
            role="reader"
        )
        self.book = Book.objects.create(
            title="Feedback Book",
            description="Testing feedback book",
            summary_text="Summary text",
            author="Author Name",
            publisher="Publisher LLC"
        )
        
        self.site_feedback = SiteFeedback.objects.create(
            user=self.user,
            comment="Great site!",
            rating=5
        )
        self.book_feedback = BookFeedback.objects.create(
            user=self.user,
            book=self.book,
            comment="Awesome book!",
            rating=4
        )

    def test_get_site_feedback_public(self):
        response = self.client.get("/api/feedback/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming the response is a list
        self.assertGreaterEqual(len(response.data), 1)

    def test_post_site_feedback_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {"comment": "New site feedback", "rating": 4}
        response = self.client.post("/api/feedback/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["comment"], "New site feedback")

    def test_post_site_feedback_unauthenticated(self):
        data = {"comment": "Unauth feedback", "rating": 3}
        response = self.client.post("/api/feedback/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_book_feedback(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/books/{self.book.id}/feedbacks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["comment"], "Awesome book!")

    def test_post_book_feedback(self):
        self.client.force_authenticate(user=self.user)
        data = {"comment": "Another comment", "rating": 5}
        response = self.client.post(f"/api/books/{self.book.id}/feedbacks/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["comment"], "Another comment")
