from django.db import models
from Accounts.models import User
from Books.models import Book

class SiteFeedback(models.Model):
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="site_feedbacks"
    )
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES,default=1)
    comment = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.rating}⭐"





class BookFeedback(models.Model):
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE, 
        related_name="feedbacks"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="feedbacks"
    )
    comment = models.TextField()
    
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )


    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.book} ({self.rating}★)"
