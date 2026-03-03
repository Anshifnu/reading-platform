from rest_framework import serializers
from .models import SiteFeedback,BookFeedback


class SiteFeedbackSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SiteFeedback
        fields = ("id", "user", "comment","rating", "created_at")


class BookFeedbackSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = BookFeedback
        fields = ("id", "user", "comment", "rating", "created_at")