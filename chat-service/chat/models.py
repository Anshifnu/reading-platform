# chat/models.py
from django.db import models

class ChatRoom(models.Model):
    ROOM_TYPE_CHOICES = (
        ("READER_AUTHOR", "Reader to Author"),
        ("AUTHOR_AUTHOR", "Author to Author"),
    )

    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

class ChatParticipant(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    user_id = models.IntegerField()  
    role = models.CharField(max_length=10)  


class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
    )

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    sender_id = models.IntegerField()
    content = models.TextField(blank=True, null=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    created_at = models.DateTimeField(auto_now_add=True)
