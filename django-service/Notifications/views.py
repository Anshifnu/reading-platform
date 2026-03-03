from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from .models import DeviceToken

from .serializers import DeviceTokenSerializer

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get active notifications for the logged-in user",
        responses={
            200: NotificationSerializer(many=True),
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def get(self, request):
        notifications = Notification.objects.filter(
            user=request.user,
            is_active=True
        ).order_by("-created_at")

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Mark a notification as read",
        manual_parameters=[
            openapi.Parameter(
                "notification_id",
                openapi.IN_PATH,
                description="ID of the notification to mark as read",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "message": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        example="Notification marked as read"
                    )
                }
            ),
            404: openapi.Response(description="Notification not found"),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            notification.is_read = True
            notification.save(update_fields=["is_read"])
            return Response({"message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found"},
                status=404
            )

class DeactivateNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Deactivate (remove) a notification for the logged-in user",
        manual_parameters=[
            openapi.Parameter(
                "notification_id",
                openapi.IN_PATH,
                description="ID of the notification to deactivate",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "message": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        example="Notification removed"
                    )
                }
            ),
            404: openapi.Response(description="Notification not found"),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def post(self, request, notification_id):
        updated = Notification.objects.filter(
            id=notification_id,
            user=request.user
        ).update(is_active=False)

        if updated == 0:
            return Response(
                {"error": "Notification not found"},
                status=404
            )

        return Response({"message": "Notification removed"})



class DeviceTokenCreateUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print(f"[DeviceToken] Received data: {request.data}, User: {request.user}")
        serializer = DeviceTokenSerializer(data=request.data)

        if serializer.is_valid():
            token = serializer.validated_data["token"]

            device, created = DeviceToken.objects.update_or_create(
                token=token,
                defaults={"user": request.user}
            )

            return Response({
                "message": "Token saved successfully",
                "created": created
            })

        print(f"[DeviceToken] Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=400)