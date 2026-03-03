from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import ReaderWallet, AuthorEarning

User = settings.AUTH_USER_MODEL

@receiver(post_save, sender=User)
def create_wallet_or_earning(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'reader':
            ReaderWallet.objects.create(user_id=instance.id)
        elif instance.role == 'author':
            AuthorEarning.objects.create(author_id=instance.id)
