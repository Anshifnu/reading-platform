from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    DeactivateNotificationView,
    DeviceTokenCreateUpdateView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view()),
    path("notifications/<int:notification_id>/read/", MarkNotificationReadView.as_view()),
    path("notifications/<int:notification_id>/remove/", DeactivateNotificationView.as_view()),
    path("save-device-token/", DeviceTokenCreateUpdateView.as_view()),
]
