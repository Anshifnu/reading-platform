import os
import django
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model

# Setup Django if running standalone
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Managmet.settings')
django.setup()

User = get_user_model()
usernames_to_check = ["Anshif", "anshif", "admin"]
password = "anshif123"

print("--- Listing ALL Users ---")
for u in User.objects.all():
    print(f"ID: {u.pk}, Username: '{u.username}', Email: '{u.email}', Superuser: {u.is_superuser}, Active: {u.is_active}")

print("\n--- Testing Authentication ---")
for username in usernames_to_check:
    print(f"\nChecking username: '{username}'")
    try:
        user = User.objects.get(username=username)
        print(f"✅ User found: {user}")
        print(f"  Password valid: {user.check_password(password)}")
        
        # Try authenticate
        auth_user = authenticate(username=username, password=password)
        if auth_user:
            print(f"✅ Authenticate(username) SUCCESS")
        else:
            print(f"❌ Authenticate(username) FAILED")
            
    except User.DoesNotExist:
        print(f"❌ User '{username}' does not exist.")
