from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from Profiles.models import UserProfile
from .serializers import AuthorListSerializer
from rest_framework import status
from .models import AuthorsWork
from .serializers import AuthorsWorkSerializer
from .permissions import IsAuthorRole
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class AuthorListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(
        operation_description="Get list of all authors",
        responses={
            200: AuthorListSerializer(many=True),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )

    def get(self, request):
        authors = UserProfile.objects.filter(
            user__role="author"
        ).select_related("user")

        serializer = AuthorListSerializer(authors, many=True)
        return Response(serializer.data)



class AuthorsWorkCreateView(APIView):
    permission_classes = [IsAuthorRole]

    def post(self, request):
        serializer = AuthorsWorkSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class AuthorsWorkListView(APIView):

    def get(self, request):
        works = AuthorsWork.objects.all().order_by("-created_at")
        serializer = AuthorsWorkSerializer(works, many=True)
        return Response(serializer.data)


class AuthorsWorkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get a single work by ID",
        responses={200: AuthorsWorkSerializer()},
    )
    def get(self, request, pk):
        try:
            work = AuthorsWork.objects.get(pk=pk)
            serializer = AuthorsWorkSerializer(work)
            return Response(serializer.data)
        except AuthorsWork.DoesNotExist:
            return Response({"error": "Work not found"}, status=status.HTTP_404_NOT_FOUND)

    @swagger_auto_schema(
        operation_description="Update a work",
        request_body=AuthorsWorkSerializer,
        responses={200: AuthorsWorkSerializer()},
    )
    def put(self, request, pk):
        try:
            work = AuthorsWork.objects.get(pk=pk)
            if work.author != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = AuthorsWorkSerializer(work, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except AuthorsWork.DoesNotExist:
            return Response({"error": "Work not found"}, status=status.HTTP_404_NOT_FOUND)


class MyWorksListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        works = AuthorsWork.objects.filter(author=request.user).order_by("-created_at")
        serializer = AuthorsWorkSerializer(works, many=True, context={"request": request})
        return Response(serializer.data)