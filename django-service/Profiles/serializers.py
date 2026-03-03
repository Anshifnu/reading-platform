from rest_framework import serializers
from django.conf import settings
from .models import UserProfile
from FollowSystem.models import ReaderWallet, AuthorEarning

User = settings.AUTH_USER_MODEL


class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.username")
    role = serializers.CharField(source="user.role")
    email = serializers.EmailField(source="user.email")
    profile_image_url = serializers.SerializerMethodField()
    coins = serializers.SerializerMethodField()
    earnings = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "user",
            "name",
            "email",
            "role",
            "profile_image_url",
            "bio",
            "created_at",
            "coins",
            "earnings",
        ]

    def get_profile_image_url(self, obj):
        # 1. If we have a direct string URL (like from Cloudinary), use it
        if getattr(obj, "profile_image_url", None):
            return obj.profile_image_url
            
        # 2. Otherwise fall back to the built-in image field (Local storage)
        if obj.profile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

    def get_coins(self, obj):
        if obj.user.role == "reader":
            try:
                wallet = ReaderWallet.objects.get(user_id=obj.user.id)
                return wallet.balance
            except ReaderWallet.DoesNotExist:
                return 0
        return 0

    def get_earnings(self, obj):
        if obj.user.role == "author":
            try:
                earning = AuthorEarning.objects.get(author_id=obj.user.id)
                return earning.total_earned
            except AuthorEarning.DoesNotExist:
                return 0
        return 0




class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["profile_image", "profile_image_url", "bio"]
