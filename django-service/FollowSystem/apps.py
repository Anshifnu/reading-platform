from django.apps import AppConfig


class FollowsystemConfig(AppConfig):
    name = 'FollowSystem'

    def ready(self):
        import FollowSystem.signals
