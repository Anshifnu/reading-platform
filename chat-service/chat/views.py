# chat/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ChatRoom, ChatParticipant, Message
from .services import can_chat
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


def get_user_id(request):
    print("DEBUG request.user:", request.user)
    print("DEBUG is_authenticated:", request.user.is_authenticated)

    if not request.user or not request.user.is_authenticated:
        print("DEBUG ❌ user not authenticated")
        return None

    print("DEBUG ✅ user id:", request.user.id)
    return request.user.id



@api_view(["POST"])
def create_room(request):
    print("🔥 create_room called")

    # ✅ sender from JWT
    if not request.user or not request.user.is_authenticated:
        return Response({"error": "Unauthorized"}, status=401)

    sender_id = request.user.id
    sender_role = request.data.get("sender_role")

    receiver = request.data.get("receiver")

    if not sender_role or not receiver:
        return Response({"error": "Invalid payload"}, status=400)

    if "id" not in receiver or "role" not in receiver:
        return Response({"error": "Receiver must have id and role"}, status=400)

    receiver_id = receiver["id"]
    receiver_role = receiver["role"]

    sender = {
        "id": sender_id,
        "role": sender_role,
    }

    receiver = {
        "id": receiver_id,
        "role": receiver_role,
    }

    # ✅ permission check
    allowed, msg = can_chat(sender, receiver)
    if not allowed:
        return Response({"error": msg}, status=403)

    # ✅ room type
    room_type = (
        "AUTHOR_AUTHOR"
        if sender_role == "author" and receiver_role == "author"
        else "READER_AUTHOR"
    )

    # 🔹 CHECK FOR EXISTING ROOM
    sender_rooms = ChatParticipant.objects.filter(user_id=sender_id).values_list('room_id', flat=True)
    existing_participant = ChatParticipant.objects.filter(user_id=receiver_id, room_id__in=sender_rooms).first()

    if existing_participant:
        print(f"♻️ Found existing room: {existing_participant.room_id}")
        return Response({"room_id": existing_participant.room_id})

    room = ChatRoom.objects.create(room_type=room_type)

    ChatParticipant.objects.bulk_create([
        ChatParticipant(
            room=room,
            user_id=sender_id,
            role=sender_role
        ),
        ChatParticipant(
            room=room,
            user_id=receiver_id,
            role=receiver_role
        ),
    ])

    return Response({"room_id": room.id})



@api_view(["GET"])
@permission_classes([IsAuthenticated])   # ✅ THIS LINE WAS MISSING
def my_rooms(request):
    print("🔥 my_rooms API called")
    print("🔥 request.user:", request.user)
    print("🔥 authenticated:", request.user.is_authenticated)

    user_id = request.user.id

    rooms = ChatRoom.objects.filter(
        chatparticipant__user_id=user_id
    ).distinct().prefetch_related('chatparticipant_set')

    print("🔥 rooms count:", rooms.count())

    data = []
    for room in rooms:
        participants = room.chatparticipant_set.all()
        last_msg = room.message_set.order_by('-created_at').first()
        
        data.append({
            "id": room.id, 
            "room_type": room.room_type,
            "last_message": last_msg.content if last_msg else None,
            "last_active": last_msg.created_at if last_msg else room.created_at,
            "participants": [
                {"user_id": p.user_id, "role": p.role}
                for p in participants
            ]
        })
    
    # Sort by last active desc
    data.sort(key=lambda x: x['last_active'], reverse=True)

    return Response(data)




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_attachment(request):
    if "file" not in request.FILES:
        return Response({"error": "No file provided"}, status=400)

    file = request.FILES["file"]
    # In a real app, you might want to save this to a specific model or 
    # use a serializer to handle validation and storage.
    # For now, we'll just save it to a Message instance or a temporary storage
    # But since we need to send the URL to the websocket, we actually need to store it.
    
    # Let's save it via a dummy message or just straight to storage if we had a media handler.
    # A better approach for this simple setup:
    # 1. Create a Message with type='image'/'video' and the file, but NO room/sender yet? 
    #    No, that violates constraints.
    # 2. Or, just return the file URL if we were using a separate FileUpload model.
    # 3. For simplicity in this stack, we will save it when the user sends the message?
    #    No, usually we upload first, get URL, then send message.
    
    # Let's create a Helper model or just save to FS and return URL.
    # Since we modified Message to have attachment, we can't save it there without a row.
    
    # Strategy: Allow creating a "draft" message or just use standard Django FileSystemStorage
    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile
    
    path = default_storage.save(f"chat_attachments/{file.name}", ContentFile(file.read()))
    url = default_storage.url(path)
    
    # Generate full URL if needed
    full_url = request.build_absolute_uri(url)
    
    return Response({"url": full_url, "filename": file.name})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    print(f"🔥 delete_message called for ID: {message_id}")
    print(f"👤 request.user: {request.user}, ID: {getattr(request.user, 'id', 'No ID')}")
    
    try:
        message = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response({"error": "Message not found"}, status=404)

    print(f"📩 Message sender_id: {message.sender_id}")

    if message.sender_id != request.user.id:
        print("❌ Sender ID does not match User ID")
        return Response({"error": "Unauthorized"}, status=403)

    # Check time limit (1 hour)
    import datetime
    from django.utils import timezone
    
    time_diff = timezone.now() - message.created_at
    if time_diff.total_seconds() > 3600:
        return Response({"error": "Cannot delete messages older than 1 hour"}, status=400)

    message.delete()
    return Response({"message": "Message deleted"})


@api_view(["GET"])
def room_messages(request, room_id):
    user_id = get_user_id(request)
    if not user_id:
        return Response({"error": "Unauthorized"}, status=401)

    allowed = ChatParticipant.objects.filter(
        room_id=room_id,
        user_id=user_id
    ).exists()

    if not allowed:
        return Response({"error": "Forbidden"}, status=403)

    messages = Message.objects.filter(
        room_id=room_id
    ).order_by("created_at")

    return Response([
        {
            "id": msg.id,
            "sender": msg.sender_id,
            "message": msg.content,
            "attachment": msg.attachment.url if msg.attachment else None,
            "message_type": msg.message_type,
            "time": msg.created_at
        }
        for msg in messages
    ])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_room_details(request, room_id):
    user_id = get_user_id(request)
    if not user_id:
        return Response({"error": "Unauthorized"}, status=401)

    try:
        room = ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)

    participants = ChatParticipant.objects.filter(room=room)
    
    # Check if user is a participant
    if not participants.filter(user_id=user_id).exists():
        return Response({"error": "Forbidden"}, status=403)

    return Response({
        "id": room.id,
        "room_type": room.room_type,
        "participants": [
            {"user_id": p.user_id, "role": p.role}
            for p in participants
        ]
    })
