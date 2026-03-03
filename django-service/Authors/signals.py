from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AuthorsWork
from FollowSystem.models import FollowRequest
from Notifications.models import Notification

@receiver(post_save, sender=AuthorsWork)
def notify_followers_new_work(sender, instance, created, **kwargs):
    if created:
        author = instance.author
        # Get all approved followers
        followers = FollowRequest.objects.filter(
            following_id=author.id,
            status="ACCEPTED"
        ).values_list("follower_id", flat=True)

        # Create notifications for each follower
        notifications = []
        for follower_id in followers:
            notifications.append(
                Notification(
                    user_id=follower_id,
                    type="NEW_POST",
                    title=f"New Post from {author.username}",
                    message=f"{author.username} has posted a new work: {instance.title}",
                    related_object_id=instance.id
                )
            )
        
        # Bulk create for performance
        if notifications:
            Notification.objects.bulk_create(notifications)
