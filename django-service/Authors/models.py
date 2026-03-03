from django.db import models
from Accounts.models import User

class AuthorsWork(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    summary=models.CharField(max_length=1000)
    category=models.CharField(max_length=30)
    content = models.TextField()  # stores HTML
    image = models.ImageField(upload_to="authorswork/images/")
    created_at = models.DateTimeField(auto_now_add=True)

