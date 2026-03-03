"""
ASGI config for chat_service project.
"""

import os
from django.core.asgi import get_asgi_application

# 1️⃣ Set settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "chat_service.settings")

# 2️⃣ Initialize Django FIRST
django_asgi_app = get_asgi_application()

# 3️⃣ Import Channels + chat code AFTER Django is ready
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import JWTAuthMiddleware
import chat.routing

# 4️⃣ Build ASGI application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(chat.routing.websocket_urlpatterns)
    ),
})
