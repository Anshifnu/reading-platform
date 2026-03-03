from django.db import models
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Book(models.Model):
    VOICE_TYPE_CHOICES = (
        ("manual", "Manual Voice"),
        ("ai", "AI Generated Voice"),
    )

    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    description = models.TextField(help_text="Short book description")
    publisher = models.CharField(max_length=255, blank=True)

    pdf_file = models.URLField(max_length=500, blank=True, default="")
    summary_text = models.TextField()
    voice_type = models.CharField(max_length=10, choices=VOICE_TYPE_CHOICES, default="manual")
    audio_file = models.URLField(max_length=500, blank=True, default="")
    language = models.CharField(max_length=50, default="English")

    categories = models.ManyToManyField(Category, related_name="books", blank=True)

    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class BookImage(models.Model):
    book = models.ForeignKey(Book, related_name="images", on_delete=models.CASCADE)
    image = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.book.title}"


# ✅ NEW MODEL
class CategoryImage(models.Model):
    category = models.ForeignKey(
        Category,
        related_name="images",
        on_delete=models.CASCADE
    )
    image = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.category.name}"





class FavoriteBook(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorite_books"
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="liked_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "book")  # 🚫 no duplicate likes

    def __str__(self):
        return f"{self.user} liked {self.book.title}"


class BookSubmission(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending Verification"),
        ("verified", "Verified by AI"),
        ("approved", "Approved by Admin"),
        ("rejected", "Rejected"),
    )

    submitter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="book_submissions")
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    description = models.TextField(help_text="Short book description")
    publisher = models.CharField(max_length=255, blank=True)
    
    pdf_file = models.URLField(max_length=500, blank=True, default="")
    cover_image = models.URLField(max_length=500, blank=True, default="")
    summary_text = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    suggested_category_name = models.CharField(max_length=100, blank=True, null=True)
    
    # New fields for verification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    verification_report = models.JSONField(default=dict, blank=True)
    admin_feedback = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Submission: {self.title} by {self.submitter}"
