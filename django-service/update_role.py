import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Managmet.settings')
django.setup()

from Accounts.models import CustomUser

try:
    user = CustomUser.objects.get(email='anshif@yopmail.com')
    user.role = 'author'
    user.save()
    print(f"Success: Role updated to {user.role} for {user.email}")
except CustomUser.DoesNotExist:
    print("Error: User not found!")
except Exception as e:
    print(f"Error: {e}")
