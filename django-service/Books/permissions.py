from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrPublisher(BasePermission):
    """
    Allow GET for anyone
    Allow POST only for admin or publisher
    """

    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS for anyone
        if request.method in SAFE_METHODS:
            return True

        # POST / PUT / PATCH / DELETE
        if not request.user.is_authenticated:
            return False

        return (
            request.user.is_staff or
            getattr(request.user, "role", None) == "publisher"
        )
