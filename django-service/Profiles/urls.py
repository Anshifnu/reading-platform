from django.urls import path
from .views import UserProfileAPIView
from .views import UpdateMyProfileAPIView

urlpatterns = [
    
    path("profile/<int:user_id>/", UserProfileAPIView.as_view()),

    path("profile/update/", UpdateMyProfileAPIView.as_view()),

]
