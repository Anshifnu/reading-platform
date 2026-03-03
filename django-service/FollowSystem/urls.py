from django.urls import path
from .views import (
    SendFollowRequestAPIView,
    RespondFollowRequestAPIView,
    PendingFollowRequestsAPIView,
    MyFollowingAPIView,
    MyPendingFollowRequestsAPIView,
    FollowStatusAPIView,
    DeductCoinsAPIView,
    FollowersCountAPIView,
    FollowingCountAPIView
)


urlpatterns = [
    path("follow-request/", SendFollowRequestAPIView.as_view()),
    path("follow-respond/", RespondFollowRequestAPIView.as_view()),
    path("follow-requests/pending/", PendingFollowRequestsAPIView.as_view()),
    path("my-following/", MyFollowingAPIView.as_view()),
    path("my-pending-requests/", MyPendingFollowRequestsAPIView.as_view()),

    path("status/", FollowStatusAPIView.as_view()),
    path("coins/deduct/", DeductCoinsAPIView.as_view()),

    path("followers-count/<int:user_id>/", FollowersCountAPIView.as_view()),
    path("following-count/<int:user_id>/", FollowingCountAPIView.as_view()),
    
]


