from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.db import close_old_connections
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        close_old_connections()

        # 🔑 IMPORT HERE (lazy import)
        from django.contrib.auth.models import AnonymousUser

        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)

        token = query_params.get("token")

        if token:
            scope["user"] = await self.get_user(token[0])
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user(self, token_key):
        from django.contrib.auth.models import AnonymousUser
        from chat.authentication import StatelessJWTAuthentication
        try:
            jwt_auth = StatelessJWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token_key)
            return jwt_auth.get_user(validated_token)
        except Exception:
            return AnonymousUser()
