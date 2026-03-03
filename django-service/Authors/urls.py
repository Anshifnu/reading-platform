from django.urls import path
from django.urls import path
from .views import AuthorListAPIView,AuthorsWorkCreateView,AuthorsWorkListView, AuthorsWorkDetailView, MyWorksListView

urlpatterns = [
    path("authors/listing/", AuthorListAPIView.as_view()),
    path("authors/work-create/",AuthorsWorkCreateView.as_view()),
    path("authors/work-list/",AuthorsWorkListView.as_view()),
    path("authors/work/<int:pk>/", AuthorsWorkDetailView.as_view()),
    path("authors/my-works/", MyWorksListView.as_view()),
    
]
