from django.urls import path
from .views import create_room, my_rooms, room_messages, upload_attachment, delete_message, get_room_details

urlpatterns = [
    path("rooms/create/", create_room),
    path("rooms/", my_rooms),
    path("rooms/<int:room_id>/", get_room_details),
    path("rooms/<int:room_id>/messages/", room_messages),
    path("upload/", upload_attachment),
    path("message/<int:message_id>/delete/", delete_message),
]
