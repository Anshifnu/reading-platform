from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.timezone import now

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if not created:
        return

    context = {
        "user_name": instance.username or instance.email,
        "login_url": "http://localhost:3000/login",
        "year": now().year,
    }

    html_content = render_to_string(
        "emails/welcome_email.html",
        context
    )

    email = EmailMultiAlternatives(
        subject="Welcome to RailwayConnect 🚆",
        body="Welcome to RailwayConnect!",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[instance.email],
    )

    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=True)
