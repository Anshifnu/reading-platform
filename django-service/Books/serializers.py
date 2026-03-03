from rest_framework import serializers
from .models import Book, Category, BookImage, CategoryImage, FavoriteBook, BookSubmission
from django.conf import settings
from django.db.models import Count
from Feedback.models import BookFeedback
from django.db.models import Avg



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name")


class BookImageSerializer(serializers.ModelSerializer):
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


class BookSerializer(serializers.ModelSerializer):
    # READ
    categories = CategorySerializer(many=True, read_only=True)
    images = BookImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()

    # WRITE
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Book
        fields = "__all__"

    def get_average_rating(self, obj):
        avg = BookFeedback.objects.filter(book=obj).aggregate(
            avg_rating=Avg("rating")
        )["avg_rating"]
        return round(avg, 1) if avg else 0

    def create(self, validated_data):
        category_ids = validated_data.pop("category_ids", [])
        book = Book.objects.create(**validated_data)
        book.categories.set(category_ids)
        return book


class CategoryImageSerializer(serializers.ModelSerializer):
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


class CategoryimgSerializer(serializers.ModelSerializer):
    images = CategoryImageSerializer(many=True, read_only=True)
    book_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ("id", "name", "images", "book_count")





class BookFeedbackSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = BookFeedback
        fields = ("id", "user", "comment", "rating", "created_at")

class BookDetailSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    images = BookImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    feedbacks = BookFeedbackSerializer(many=True, read_only=True)

    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Book
        fields = "__all__"


    def get_average_rating(self, obj):
        avg = BookFeedback.objects.filter(book=obj).aggregate(
            avg_rating=Avg("rating")
        )["avg_rating"]
        return round(avg, 1) if avg else 0



class FavoriteBookSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="book.id", read_only=True)
    title = serializers.CharField(source="book.title", read_only=True)
    is_public = serializers.BooleanField(source="book.is_public", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = FavoriteBook
        fields = ["id", "title", "image", "is_public"]

    def get_image(self, obj):
        image = obj.book.images.first()
        if image:
            url = image.image or ""
            if url.startswith("http"):
                return url
            if url:
                request = self.context.get("request")
                media_url = settings.MEDIA_URL
                full = f"{media_url}{url}"
                if request:
                    return request.build_absolute_uri(full)
                return full
        return None


class BookSubmissionSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    verification_report = serializers.JSONField(read_only=True)
    admin_feedback = serializers.CharField(read_only=True)
    submitter = serializers.StringRelatedField(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    pdf_file = serializers.URLField(max_length=500, required=False, allow_blank=True)
    cover_image = serializers.URLField(max_length=500, required=False, allow_blank=True)

    class Meta:
        model = BookSubmission
        fields = "__all__"
        extra_kwargs = {
            'category': {'required': False, 'allow_null': True}
        }

    def _build_url(self, value):
        """Return full URL for both Cloudinary URLs and old relative media paths."""
        if not value:
            return None
        val = str(value)
        if val.startswith(("http://", "https://")):
            return val
        request = self.context.get("request")
        media_path = f"{settings.MEDIA_URL}{val}"
        if request:
            return request.build_absolute_uri(media_path)
        return media_path

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['pdf_file'] = self._build_url(instance.pdf_file)
        representation['cover_image'] = self._build_url(instance.cover_image)
        return representation