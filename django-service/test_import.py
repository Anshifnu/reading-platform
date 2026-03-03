import sys
sys.path.append('.')
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Managmet.settings')
import django
django.setup()

try:
    from django.urls import resolve
    from django.core.management import call_command
    call_command("check")
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
