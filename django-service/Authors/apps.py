from django.apps import AppConfig


class AuthorsConfig(AppConfig):
    name = 'Authors'

    def ready(self):
        import Authors.signals
