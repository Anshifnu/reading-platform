from rest_framework_simplejwt.authentication import JWTAuthentication

class StatelessUser:
    def __init__(self, user_id):
        try:
            self.id = int(user_id)
        except (ValueError, TypeError):
             self.id = user_id

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return True


class StatelessJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        if not user_id:
            return None

        return StatelessUser(user_id)
