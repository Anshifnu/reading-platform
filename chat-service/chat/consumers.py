import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from .services import validate_and_charge_chat
from .models import ChatParticipant, ChatRoom, Message

class ChatConsumer(AsyncWebsocketConsumer):
    # ... (connection methods remain same)

    # Removed duplicate save_message method


    # ... (get_chat_participants_info remains same)

    async def receive(self, text_data):
        # ... (parsing and validation logic remains same)

        # 4. Save Message
        await self.save_message(self.room_id, self.user_id, message)

        # 5. Broadcast (remains same)
    async def connect(self):
        user = self.scope["user"]

        if user.is_anonymous:
            await self.close()
            return

        self.user_id = user.id
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ WebSocket connected | user={user.id} room={self.room_id}")

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    @database_sync_to_async
    def save_message(self, room_id, sender_id, message_content, message_type='text', attachment=None):
        try:
            room = ChatRoom.objects.get(id=room_id)
            msg = Message.objects.create(
                room=room,
                sender_id=sender_id,
                content=message_content,
                message_type=message_type
            )
            
            if attachment:
                # attachment is just the filename from frontend
                # We need to prepend the upload directory to match where it was saved
                # It was saved to 'chat_attachments/filename'
                if not attachment.startswith('chat_attachments/'):
                    msg.attachment.name = f"chat_attachments/{attachment}"
                else:
                    msg.attachment.name = attachment
                msg.save()
            
            print(f"💾 Message saved to DB: ID={msg.id} Type={message_type} Content={message_content} Attachment={msg.attachment.name}")
            return msg
        except Exception as e:
            import traceback
            print(f"❌ Failed to save message: {e}")
            traceback.print_exc()
            return None

    @database_sync_to_async
    def get_chat_participants_info(self):
        # ... (same as before) ...
        try:
            sender_part = ChatParticipant.objects.get(
                room_id=self.room_id,
                user_id=self.user_id
            )
            receiver_part = ChatParticipant.objects.filter(
                room_id=self.room_id
            ).exclude(user_id=self.user_id).first()
            
            return {
                "sender_role": sender_part.role,
                "receiver_id": receiver_part.user_id if receiver_part else None
            }
        except ChatParticipant.DoesNotExist:
            return None


    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        message_type = data.get("message_type", "text")
        attachment = data.get("attachment")
        
        if not message and not attachment:
            return

        info = await self.get_chat_participants_info()
        if not info or not info["receiver_id"]:
            await self.send(text_data=json.dumps({"error": "Chat participants not found"}))
            return

        sender_role = info["sender_role"]
        receiver_id = info["receiver_id"]

        query_string = self.scope.get("query_string", b"").decode("utf-8")
        token = None
        if "token=" in query_string:
            token = query_string.split("token=")[1].split("&")[0]

        if not token:
             await self.send(text_data=json.dumps({"error": "Authenticaion token missing for charge"}))
             return

        is_allowed, error_msg = await sync_to_async(validate_and_charge_chat)(
            sender_id=self.user_id,
            sender_role=sender_role,
            receiver_id=receiver_id,
            message=message or "Media message",
            token=token
        )

        if not is_allowed:
            await self.send(text_data=json.dumps({"error": error_msg}))
            return

        # 4. Save Message
        saved_msg = await self.save_message(self.room_id, self.user_id, message, message_type, attachment)
        
        if saved_msg:
            # 5. Broadcast
            print(f"📢 Broadcasting message to group {self.room_group_name}")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat.message",
                    "id": saved_msg.id,
                    "message": message,
                    "message_type": message_type,
                    "attachment": attachment,
                    "sender": self.user_id,
                    "created_at": saved_msg.created_at.isoformat()
                }
            )
            print("✅ Message broadcast sent")

    async def chat_message(self, event):
        print(f"📨 Sending message to client {self.user_id}: {event.get('message', 'Media')}")
        await self.send(text_data=json.dumps({
            "id": event.get("id"),
            "sender": event["sender"],
            "message": event["message"],
            "message_type": event.get("message_type", "text"),
            "attachment": event.get("attachment"),
            "created_at": event.get("created_at")
        }))



