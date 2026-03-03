from django.urls import path
from .views import AdminUserListView, AdminBlockUserView, AdminChangeRoleView
from .views import AdminBookListView, AdminBookCreateView, AdminBookUpdateView, AdminBookDeleteView
from .views import AdminCategoryListView, AdminCategoryCreateView, AdminCategoryUpdateView, AdminCategoryDeleteView
from .views import AdminAnalyticsView

urlpatterns = [
    # User management
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<int:user_id>/block/", AdminBlockUserView.as_view(), name="admin-block-user"),
    path("admin/users/<int:user_id>/change-role/", AdminChangeRoleView.as_view(), name="admin-change-role"),

    # Book management
    path("admin/books/", AdminBookListView.as_view(), name="admin-book-list"),
    path("admin/books/create/", AdminBookCreateView.as_view(), name="admin-book-create"),
    path("admin/books/<int:book_id>/update/", AdminBookUpdateView.as_view(), name="admin-book-update"),
    path("admin/books/<int:book_id>/delete/", AdminBookDeleteView.as_view(), name="admin-book-delete"),

    # Category management
    path("admin/categories/", AdminCategoryListView.as_view(), name="admin-category-list"),
    path("admin/categories/create/", AdminCategoryCreateView.as_view(), name="admin-category-create"),
    path("admin/categories/<int:cat_id>/update/", AdminCategoryUpdateView.as_view(), name="admin-category-update"),
    path("admin/categories/<int:cat_id>/delete/", AdminCategoryDeleteView.as_view(), name="admin-category-delete"),

    # Analytics
    path("admin/analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),
]
