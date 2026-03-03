from rest_framework import serializers
from .models import Notification
from .models import DeviceToken
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "is_read",
            "is_active",
            "related_object_id",
            "created_at",
        ]




class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ["token"]
        extra_kwargs = {
            "token": {"validators": []}  # skip unique validator; view handles upsert
        }