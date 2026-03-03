from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):

    phone_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)

    ROLE_CHOICES = (
        ('reader', 'Reader'),
        ("author", "Author"),
        ('admin', 'Admin'),
        
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='reader')

    # 🔹 VERIFICATION FLAGS
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    
    is_active = models.BooleanField(default=False)
    has_permission = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)




