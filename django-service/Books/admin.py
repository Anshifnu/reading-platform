from django.contrib import admin
from .models import Book, BookImage, Category, CategoryImage


# -------------------------
# Book Image Inline
# -------------------------
class BookImageInline(admin.TabularInline):
    model = BookImage
    extra = 1


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "publisher",
        "voice_type",
        "language",
        "is_public",
        "created_at",
    )
    list_filter = ("voice_type", "language", "is_public", "categories")
    search_fields = ("title", "author", "publisher")
    ordering = ("-created_at",)
    inlines = [BookImageInline]


# -------------------------
# Category Image Inline
# -------------------------
class CategoryImageInline(admin.TabularInline):
    model = CategoryImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ("name",)
    inlines = [CategoryImageInline]
