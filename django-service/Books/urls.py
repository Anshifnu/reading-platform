from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from .views import BookListCreateView, CategoryListView, CategoryCheckView, BookDetailView, TranslateText
from .views import FavoriteBookListView, AddFavoriteBookView, RemoveFavoriteBookView
from .views import BookSubmissionCreateView, AdminSubmissionListView, VerifySubmissionView, ApproveSubmissionView, RejectSubmissionView
from .views import TelegramWebhookView

urlpatterns = [
    
    path("books/", BookListCreateView.as_view(), name="book-list-create"),
    path("books/<int:pk>/", BookDetailView.as_view()),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("categories/check/", CategoryCheckView.as_view(), name="category-check"),
    path("translate/",TranslateText.as_view()),
    path("favorites/", FavoriteBookListView.as_view(), name="favorite-list"),
    path("favorites/add/", AddFavoriteBookView.as_view(), name="favorite-add"),
    path("favorites/remove/<int:book_id>/", RemoveFavoriteBookView.as_view(), name="favorite-remove"),

    # Book Submission & Verification
    path("submissions/", BookSubmissionCreateView.as_view(), name="book-submission-create"),
    path("admin/submissions/", AdminSubmissionListView.as_view(), name="admin-submission-list"),
    path("admin/submissions/<int:pk>/verify/", VerifySubmissionView.as_view(), name="admin-submission-verify"),
    path("admin/submissions/<int:pk>/approve/", ApproveSubmissionView.as_view(), name="admin-submission-approve"),
    path("admin/submissions/<int:pk>/reject/", RejectSubmissionView.as_view(), name="admin-submission-reject"),

    # Telegram Webhook
    path("telegram-webhook/", TelegramWebhookView.as_view(), name="telegram-webhook"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
