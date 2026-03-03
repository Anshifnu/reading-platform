from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "Accounts"

    def ready(self):
        # Import signals
        import Accounts.signals

        # Initialize Firebase
        from Managmet.firebase_config import initialize_firebase
        initialize_firebase()



