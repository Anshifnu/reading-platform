import requests
from Books.models import Book


AI_SERVICE_URL = "http://ai-service-app:8001/ai/verify-book"


class AIVerifier:
    def verify_submission(self, submission):
        # RAG: Fetch existing books from DB to send as context
        existing_books = list(
            Book.objects.values("id", "title", "author")
        )

        payload = {
            "title": submission.title or "",
            "author": submission.author or "",
            "description": submission.description or "",
            "summary_text": submission.summary_text or "",
            "category": (
                submission.category.name
                if submission.category
                else submission.suggested_category_name or ""
            ),
            "existing_books": existing_books,
        }

        try:
            response = requests.post(AI_SERVICE_URL, json=payload, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            return {
                "quality_score": 0,
                "content_analysis": "AI verification timed out. Please try again.",
                "category_relevance": "Unknown",
                "flagged_issues": ["Verification timed out"],
                "recommendation": "review",
                "recommendation_reason": "AI service did not respond in time.",
            }
        except requests.exceptions.RequestException as e:
            return {
                "quality_score": 0,
                "content_analysis": f"AI verification failed: {str(e)}",
                "category_relevance": "Unknown",
                "flagged_issues": ["AI service error"],
                "recommendation": "review",
                "recommendation_reason": "Could not connect to AI service.",
            }

