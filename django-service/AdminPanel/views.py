from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

from .serializers import AdminUserListSerializer
from Notifications.models import Notification

User = get_user_model()


class IsAdminUser:
    """Custom permission: only admin role users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "admin"


class AdminUserListView(APIView):
    """
    GET /api/admin/users/?search=<username>
    Returns all non-admin users with counts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        search = request.query_params.get("search", "").strip()

        users = User.objects.exclude(role="admin")

        if search:
            users = users.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )

        # Counts (always from full queryset, not filtered)
        all_non_admin = User.objects.exclude(role="admin")
        counts = {
            "total_users": all_non_admin.count(),
            "total_readers": all_non_admin.filter(role="reader").count(),
            "total_authors": all_non_admin.filter(role="author").count(),
        }

        serializer = AdminUserListSerializer(users.order_by("-created_at"), many=True)

        return Response({
            "counts": counts,
            "users": serializer.data,
        })


class AdminBlockUserView(APIView):
    """
    POST /api/admin/users/<id>/block/
    Body: { "reason": "...", "block": true/false }
    Toggles user is_active, sends email + notification.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.role == "admin":
            return Response({"error": "Cannot block an admin user."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get("reason", "No reason provided.")
        should_block = request.data.get("block", True)

        # Toggle active status
        user.is_active = not should_block
        user.save()

        action = "suspended" if should_block else "reactivated"

        # Send email notification
        try:
            subject = f"BookSphere — Your Account Has Been {action.title()}"
            message = (
                f"Dear {user.username},\n\n"
                f"Your BookSphere account has been {action} by an administrator.\n\n"
                f"Reason: {reason}\n\n"
                f"If you believe this is a mistake, please contact our support team.\n\n"
                f"Best regards,\nBookSphere Team"
            )
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"⚠️ Failed to send block email: {e}")

        # Create in-app notification
        Notification.objects.create(
            user=user,
            type="ACCOUNT_BLOCKED",
            title=f"Account {action.title()}",
            message=f"Your account has been {action}. Reason: {reason}",
        )

        return Response({
            "message": f"User '{user.username}' has been {action}.",
            "is_active": user.is_active,
        })


class AdminChangeRoleView(APIView):
    """
    POST /api/admin/users/<id>/change-role/
    Body: { "new_role": "author", "reason": "..." }
    Changes user role, sends email + notification.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.role == "admin":
            return Response({"error": "Cannot change an admin's role."}, status=status.HTTP_400_BAD_REQUEST)

        new_role = request.data.get("new_role")
        reason = request.data.get("reason", "No reason provided.")

        valid_roles = ["reader", "author"]
        if new_role not in valid_roles:
            return Response(
                {"error": f"Invalid role. Must be one of: {valid_roles}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_role = user.role
        if old_role == new_role:
            return Response({"error": f"User is already a {new_role}."}, status=status.HTTP_400_BAD_REQUEST)

        user.role = new_role
        user.save()

        # Send email notification
        try:
            subject = "BookSphere — Your Role Has Been Updated"
            message = (
                f"Dear {user.username},\n\n"
                f"Your role on BookSphere has been changed.\n\n"
                f"Previous Role: {old_role.title()}\n"
                f"New Role: {new_role.title()}\n\n"
                f"Reason: {reason}\n\n"
                f"This change is effective immediately. You may need to log out and log back in "
                f"to see the updated permissions.\n\n"
                f"Best regards,\nBookSphere Team"
            )
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"⚠️ Failed to send role change email: {e}")

        # Create in-app notification
        Notification.objects.create(
            user=user,
            type="ROLE_CHANGED",
            title="Role Updated",
            message=f"Your role has been changed from {old_role.title()} to {new_role.title()}. Reason: {reason}",
        )

        return Response({
            "message": f"User '{user.username}' role changed from {old_role} to {new_role}.",
            "old_role": old_role,
            "new_role": new_role,
        })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADMIN BOOK MANAGEMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

from rest_framework.parsers import MultiPartParser, FormParser
from Books.models import Book, Category, BookImage, CategoryImage
from .serializers import AdminBookSerializer, AdminCategorySerializer


class AdminBookListView(APIView):
    """GET /api/admin/books/?search=<title>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        search = request.query_params.get("search", "").strip()
        books = Book.objects.all()

        if search:
            books = books.filter(Q(title__icontains=search) | Q(author__icontains=search))

        total_books = Book.objects.count()
        serializer = AdminBookSerializer(
            books.order_by("-created_at"), many=True, context={"request": request}
        )

        return Response({
            "total_books": total_books,
            "books": serializer.data,
        })


class AdminBookCreateView(APIView):
    """POST /api/admin/books/create/ (JSON with Cloudinary URLs)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        required = ["title", "description", "summary_text"]
        for field in required:
            if not data.get(field):
                return Response({"error": f"'{field}' is required."}, status=status.HTTP_400_BAD_REQUEST)

        book = Book.objects.create(
            title=data.get("title"),
            author=data.get("author", ""),
            description=data.get("description"),
            publisher=data.get("publisher", ""),
            summary_text=data.get("summary_text"),
            voice_type=data.get("voice_type", "manual"),
            language=data.get("language", "English"),
            is_public=data.get("is_public", True),
            pdf_file=data.get("pdf_url", ""),
        )

        # Categories
        cat_ids = data.get("category_ids", [])
        if cat_ids:
            book.categories.set(cat_ids)

        # Image URLs from Cloudinary
        image_urls = data.get("image_urls", [])
        for url in image_urls:
            BookImage.objects.create(book=book, image=url)

        serializer = AdminBookSerializer(book, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminBookUpdateView(APIView):
    """PUT /api/admin/books/<id>/update/ (JSON with Cloudinary URLs)"""
    permission_classes = [IsAuthenticated]

    def put(self, request, book_id):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # Update text fields
        for field in ["title", "author", "description", "publisher", "summary_text", "voice_type", "language"]:
            if data.get(field) is not None:
                setattr(book, field, data.get(field))

        if data.get("is_public") is not None:
            book.is_public = data.get("is_public", True)

        # PDF URL
        if data.get("pdf_url"):
            book.pdf_file = data.get("pdf_url")

        book.save()

        # Categories
        cat_ids = data.get("category_ids", [])
        if cat_ids:
            book.categories.set(cat_ids)

        # New image URLs
        image_urls = data.get("image_urls", [])
        for url in image_urls:
            BookImage.objects.create(book=book, image=url)

        # Delete specific images
        delete_image_ids = data.get("delete_image_ids", [])
        if delete_image_ids:
            BookImage.objects.filter(id__in=delete_image_ids, book=book).delete()

        serializer = AdminBookSerializer(book, context={"request": request})
        return Response(serializer.data)


class AdminBookDeleteView(APIView):
    """DELETE /api/admin/books/<id>/delete/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, book_id):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"error": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        title = book.title
        book.delete()
        return Response({"message": f"Book '{title}' deleted."})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADMIN CATEGORY MANAGEMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AdminCategoryListView(APIView):
    """GET /api/admin/categories/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        categories = Category.objects.all().order_by("name")
        serializer = AdminCategorySerializer(categories, many=True, context={"request": request})
        return Response({"categories": serializer.data})


class AdminCategoryCreateView(APIView):
    """POST /api/admin/categories/create/ (JSON with Cloudinary URL)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Category name is required."}, status=status.HTTP_400_BAD_REQUEST)

        if Category.objects.filter(name__iexact=name).exists():
            return Response({"error": f"Category '{name}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        category = Category.objects.create(name=name)

        image_url = request.data.get("image_url", "")
        if image_url:
            CategoryImage.objects.create(category=category, image=image_url)

        serializer = AdminCategorySerializer(category, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminCategoryUpdateView(APIView):
    """PUT /api/admin/categories/<id>/update/ (JSON with Cloudinary URL)"""
    permission_classes = [IsAuthenticated]

    def put(self, request, cat_id):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            category = Category.objects.get(id=cat_id)
        except Category.DoesNotExist:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get("name", "").strip()
        if name:
            if Category.objects.filter(name__iexact=name).exclude(id=cat_id).exists():
                return Response({"error": f"Category '{name}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            category.name = name
            category.save()

        image_url = request.data.get("image_url", "")
        if image_url:
            category.images.all().delete()
            CategoryImage.objects.create(category=category, image=image_url)

        serializer = AdminCategorySerializer(category, context={"request": request})
        return Response(serializer.data)


class AdminCategoryDeleteView(APIView):
    """DELETE /api/admin/categories/<id>/delete/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, cat_id):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            category = Category.objects.get(id=cat_id)
        except Category.DoesNotExist:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

        name = category.name
        category.delete()
        return Response({"message": f"Category '{name}' deleted."})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADMIN ANALYTICS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
from Books.models import Book
from Subscription.models import UserSubscription
from Feedback.models import BookFeedback


class AdminAnalyticsView(APIView):
    """
    GET /api/admin/analytics/?period=day|week|month|year
    Returns time-series data for signups, subscriptions, books, and ratings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

        period = request.query_params.get("period", "month")

        now = timezone.now()
        trunc_map = {
            "day":   (TruncDay,   now - timedelta(days=29),    "%d %b"),
            "week":  (TruncWeek,  now - timedelta(weeks=11),   "W%W %Y"),
            "month": (TruncMonth, now - timedelta(days=364),   "%b %Y"),
            "year":  (TruncYear,  now - timedelta(days=365*4), "%Y"),
        }
        if period not in trunc_map:
            period = "month"

        TruncFn, start_date, date_fmt = trunc_map[period]

        def to_series(base_qs, date_field, filters=None):
            q = base_qs.filter(**{f"{date_field}__gte": start_date})
            if filters:
                q = q.filter(**filters)
            q = q.annotate(period=TruncFn(date_field))
            q = q.values("period").annotate(count=Count("id")).order_by("period")
            return [
                {"label": item["period"].strftime(date_fmt), "count": item["count"]}
                for item in q if item["period"] is not None
            ]

        # 1. User signups
        user_qs = User.objects.all()
        signups_total   = to_series(user_qs, "created_at")
        signups_authors = to_series(user_qs, "created_at", {"role": "author"})
        signups_readers = to_series(user_qs, "created_at", {"role": "reader"})

        # 2. Subscriptions
        sub_qs = UserSubscription.objects.filter(is_active=True)
        subs_all     = to_series(sub_qs, "start_date")
        subs_monthly = to_series(sub_qs, "start_date", {"plan__plan_type": "monthly"})
        subs_yearly  = to_series(sub_qs, "start_date", {"plan__plan_type": "yearly"})

        # 3. Books added
        books_series = to_series(Book.objects, "created_at")

        # 4. Book rating distribution (all-time)
        rating_dist = (
            BookFeedback.objects
            .values("rating")
            .annotate(count=Count("id"))
            .order_by("rating")
        )
        rating_distribution = [
            {"label": f"{r['rating']}★", "count": r["count"]}
            for r in rating_dist
        ]

        # 5. Summary totals
        totals = {
            "total_users":   User.objects.exclude(role="admin").count(),
            "total_authors": User.objects.filter(role="author").count(),
            "total_readers": User.objects.filter(role="reader").count(),
            "total_books":   Book.objects.count(),
            "active_subs":   UserSubscription.objects.filter(is_active=True).count(),
            "monthly_subs":  UserSubscription.objects.filter(is_active=True, plan__plan_type="monthly").count(),
            "yearly_subs":   UserSubscription.objects.filter(is_active=True, plan__plan_type="yearly").count(),
            "avg_rating":    round(BookFeedback.objects.aggregate(avg=Avg("rating"))["avg"] or 0, 2),
        }

        return Response({
            "period": period,
            "totals": totals,
            "signups": {
                "total":   signups_total,
                "authors": signups_authors,
                "readers": signups_readers,
            },
            "subscriptions": {
                "all":     subs_all,
                "monthly": subs_monthly,
                "yearly":  subs_yearly,
            },
            "books":               books_series,
            "rating_distribution": rating_distribution,
        })
