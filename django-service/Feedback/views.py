from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import SiteFeedback,BookFeedback
from .serializers import SiteFeedbackSerializer,BookFeedbackSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class SiteFeedbackView(ListCreateAPIView):
    queryset = SiteFeedback.objects.all()
    serializer_class = SiteFeedbackSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    @swagger_auto_schema(
        operation_description="Get all site feedbacks (public)",
        responses={200: SiteFeedbackSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create site feedback (authenticated users only)",
        request_body=SiteFeedbackSerializer,
        responses={
            201: SiteFeedbackSerializer,
            400: "Bad Request",
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookFeedbackListCreateView(ListCreateAPIView):
    serializer_class = BookFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        book_id = self.kwargs["book_id"]
        return BookFeedback.objects.filter(book_id=book_id)

    @swagger_auto_schema(
        operation_description="Get feedback list for a specific book",
        manual_parameters=[
            openapi.Parameter(
                "book_id",
                openapi.IN_PATH,
                description="ID of the book",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={200: BookFeedbackSerializer(many=True)},
        security=[{"Bearer": []}],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create feedback for a specific book",
        manual_parameters=[
            openapi.Parameter(
                "book_id",
                openapi.IN_PATH,
                description="ID of the book",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        request_body=BookFeedbackSerializer,
        responses={
            201: BookFeedbackSerializer,
            400: "Bad Request",
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        book_id = self.kwargs["book_id"]
        serializer.save(
            user=self.request.user,
            book_id=book_id
        )

