from rest_framework import serializers
from django.conf import settings
from Profiles.models import UserProfile
from .models import AuthorsWork
User = settings.AUTH_USER_MODEL


class AuthorListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.username")
    role = serializers.CharField(source="user.role")

    class Meta:
        model = UserProfile
        fields = [
            "user",              
            "name",
            "role",
            "profile_image_url",
        ]




class AuthorsWorkSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = AuthorsWork
        fields = "__all__"
        read_only_fields = ["author", "created_at"]


