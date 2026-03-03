
from django.contrib import admin
from django.urls import path,include,re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.conf.urls.static import static



schema_view = get_schema_view(
   openapi.Info(
      title="Smart Train",
      default_version='v1',
      description="API documentation for my project",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="support@example.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    
    path('api/',include('Accounts.urls')),
    path('api/',include('Books.urls')),
    path('api/',include('Feedback.urls')),
    path('api/',include('FollowSystem.urls')),
    path("api/", include("Profiles.urls")),
    path("api/", include("Authors.urls")),
    path("api/", include("Subscription.urls")),
    path("api/", include("Notifications.urls")),
    path("api/", include("AdminPanel.urls")),
        



]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
