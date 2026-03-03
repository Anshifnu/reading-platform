from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile
from .serializers import  ProfileSerializer
from .serializers import ProfileUpdateSerializer
from rest_framework import parsers
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get user profile by user ID",
        manual_parameters=[
            openapi.Parameter(
                "user_id",
                openapi.IN_PATH,
                description="User ID whose profile is requested",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={
            200: ProfileSerializer,
            404: openapi.Response(description="Profile not found"),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def get(self, request, user_id):
        try:
            profile = UserProfile.objects.select_related("user").get(
                user__id=user_id
            )
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=404
            )

        serializer = ProfileSerializer(
            profile,
            context={"request": request}
        )
        return Response(serializer.data)










class UpdateMyProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    @swagger_auto_schema(
        operation_description="Update my profile (supports partial update and image upload)",
        manual_parameters=[
            openapi.Parameter(
                name="username",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                description="Username (optional)",
                required=False,
            ),
            openapi.Parameter(
                name="bio",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                description="User bio (optional)",
                required=False,
            ),
            openapi.Parameter(
                name="profile_image",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                description="Profile image file (optional)",
                required=False,
            ),
        ],
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    "profile": openapi.Schema(type=openapi.TYPE_OBJECT),
                }
            ),
            400: openapi.Response(description="Validation error"),
            401: openapi.Response(description="Unauthorized"),
        },
        consumes=["multipart/form-data", "application/json"],
        security=[{"Bearer": []}],
    )
    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(
            user=request.user
        )

        serializer = ProfileUpdateSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "profile": serializer.data
            })

        return Response(serializer.errors, status=400)
