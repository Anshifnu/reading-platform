from django.urls import path
from .views import SiteFeedbackView,BookFeedbackListCreateView


urlpatterns = [
    path("feedback/", SiteFeedbackView.as_view(), name="site-feedback"),
     path("books/<int:book_id>/feedbacks/",BookFeedbackListCreateView.as_view())
]
