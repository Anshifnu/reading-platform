from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from Books.models import Book, Category, BookImage, CategoryImage
from Feedback.models import BookFeedback
from Subscription.models import UserSubscription
from django.db.models import Avg

User = get_user_model()


class AdminUserListSerializer(serializers.ModelSerializer):
    subscription = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "is_active",
            "is_email_verified",
            "created_at",
            "subscription",
        ]

    def get_subscription(self, obj):
        active_sub = UserSubscription.objects.filter(
            user=obj,
            is_active=True,
            end_date__gte=timezone.now()
        ).select_related("plan").first()

        if active_sub and active_sub.plan:
            return {
                "plan_name": active_sub.plan.name,
                "plan_type": active_sub.plan.plan_type,
                "start_date": active_sub.start_date.isoformat(),
                "end_date": active_sub.end_date.isoformat(),
                "is_active": True,
            }
        return None


class AdminBookImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = BookImage
        fields = ("id", "image")

    def get_image(self, obj):
        url = obj.image or ""
        if url.startswith("http"):
            return url
        if url:
            request = self.context.get("request")
            media_url = settings.MEDIA_URL
            full = f"{media_url}{url}"
            if request:
                return request.build_absolute_uri(full)
            return full
        return ""


class AdminCategorySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name")


class AdminBookSerializer(serializers.ModelSerializer):
    categories = AdminCategorySimpleSerializer(many=True, read_only=True)
    images = AdminBookImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id", "title", "author", "description", "publisher",
            "pdf_file", "summary_text", "voice_type", "audio_file",
            "language", "categories", "images", "is_public",
            "average_rating", "created_at", "updated_at",
        ]

    def get_average_rating(self, obj):
        avg = BookFeedback.objects.filter(book=obj).aggregate(
            avg_rating=Avg("rating")
        )["avg_rating"]
        return round(avg, 1) if avg else 0


class AdminCategoryImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = CategoryImage
        fields = ("id", "image")

    def get_image(self, obj):
        url = obj.image or ""
        if url.startswith("http"):
            return url
        if url:
            request = self.context.get("request")
            media_url = settings.MEDIA_URL
            full = f"{media_url}{url}"
            if request:
                return request.build_absolute_uri(full)
            return full
        return ""


class AdminCategorySerializer(serializers.ModelSerializer):
    images = AdminCategoryImageSerializer(many=True, read_only=True)
    book_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "images", "book_count")

    def get_book_count(self, obj):
        return obj.books.count()
