from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import FollowRequest
from .serializers import FollowRequestSerializer
from django.db import transaction
from .models import ReaderWallet, CoinTransaction, AuthorEarning, AuthorEarningTransaction

from Accounts.models import User
from .serializers import AuthorListSerializer

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class SendFollowRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Send follow request (readers and authors can follow authors)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["following_id"],
            properties={
                "following_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Author user ID to follow"
                )
            }
        ),
        responses={
            200: FollowRequestSerializer,
            403: "Only readers and authors can follow authors",
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def post(self, request):
        follower_id = request.user.id
        follower_role = request.user.role
        following_id = request.data.get("following_id")

        if follower_role not in ["reader", "author"]:
            return Response(
                {"error": "Only readers and authors can follow authors"},
                status=403
            )

        if follower_id == following_id:
            return Response(
                {"error": "You cannot follow yourself"},
                status=400
            )

        follow, created = FollowRequest.objects.get_or_create(
            follower_id=follower_id,
            following_id=following_id
        )
        
        if not created and follow.status == "REJECTED":
            follow.status = "PENDING"
            follow.save()

        serializer = FollowRequestSerializer(follow)
        return Response(serializer.data)



class RespondFollowRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Accept or reject a follow request (author only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["follow_id", "action"],
            properties={
                "follow_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Follow request ID"
                ),
                "action": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=["ACCEPT", "REJECT"],
                    description="Action to perform"
                ),
            }
        ),
        responses={
            200: openapi.Response(
                description="Follow request updated",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "status": openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            403: "Not allowed",
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def post(self, request):
        follow_id = request.data.get("follow_id")
        action = request.data.get("action")

        follow = FollowRequest.objects.get(id=follow_id)

        if request.user.id != follow.following_id:
            return Response(
                {"error": "Not allowed"},
                status=403
            )

        follow.status = "ACCEPTED" if action == "ACCEPT" else "REJECTED"
        follow.save()

        return Response({"status": follow.status})

    

class PendingFollowRequestsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get all pending follow requests for the logged-in author",
        responses={
            200: FollowRequestSerializer(many=True),
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def get(self, request):
        requests = FollowRequest.objects.filter(
            following_id=request.user.id,
            status="PENDING"
        )
        serializer = FollowRequestSerializer(requests, many=True)
        return Response(serializer.data)

class MyFollowingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get list of user IDs that the logged-in user is following",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_INTEGER),
                description="List of following user IDs"
            ),
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def get(self, request):
        following = FollowRequest.objects.filter(
            follower_id=request.user.id,
            status="ACCEPTED"
        ).values_list("following_id", flat=True)

        return Response(list(following))

class MyPendingFollowRequestsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get list of user IDs that the logged-in user has sent a pending follow request to",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(type=openapi.TYPE_INTEGER),
                description="List of pending following user IDs"
            ),
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def get(self, request):
        pending = FollowRequest.objects.filter(
            follower_id=request.user.id,
            status="PENDING"
        ).values_list("following_id", flat=True)

        return Response(list(pending))




class FollowStatusAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Check if a reader is following an author",
        manual_parameters=[
            openapi.Parameter('reader', openapi.IN_QUERY, description="Reader User ID", type=openapi.TYPE_INTEGER),
            openapi.Parameter('author', openapi.IN_QUERY, description="Author User ID", type=openapi.TYPE_INTEGER),
        ],
        responses={200: "Status returned"}
    )
    def get(self, request):
        reader_id = request.query_params.get("reader")
        author_id = request.query_params.get("author")

        exists = FollowRequest.objects.filter(
            follower_id=reader_id,
            following_id=author_id,
            status="ACCEPTED"
        ).exists()

        return Response({
            "status": "ACCEPTED" if exists else "NOT_ALLOWED"
        })



class WalletAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get wallet balance of the logged-in user",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "balance": openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                        description="Current wallet balance"
                    )
                }
            ),
            401: "Unauthorized",
        },
        security=[{"Bearer": []}],
    )
    def get(self, request):
        wallet, _ = ReaderWallet.objects.get_or_create(user_id=request.user.id)
        return Response({"balance": wallet.balance})




class DeductCoinsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Deduct coins from reader wallet and transfer to author",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["amount", "author_id"],
            properties={
                "amount": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Number of coins to deduct"
                ),
                "author_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Author ID receiving the coins"
                ),
            },
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "success": openapi.Schema(type=openapi.TYPE_BOOLEAN)
                }
            ),
            400: openapi.Response(description="Insufficient coins"),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def post(self, request):
        amount = request.data["amount"]
        author_id = request.data["author_id"]

        with transaction.atomic():
            wallet = ReaderWallet.objects.select_for_update().get(
                user_id=request.user.id
            )

            if wallet.balance < amount:
                return Response(
                    {"error": "Insufficient coins"},
                    status=400
                )

            # deduct from reader
            wallet.balance -= amount
            wallet.save()

            CoinTransaction.objects.create(
                user_id=request.user.id,
                amount=amount,
                transaction_type="DEBIT",
                reason="CHAT"
            )

            # add to author
            earning, _ = AuthorEarning.objects.get_or_create(
                author_id=author_id
            )
            earning.total_earned += amount
            earning.save()

            AuthorEarningTransaction.objects.create(
                author_id=author_id,
                amount=amount,
                source="CHAT"
            )

        return Response({"success": True})




class FollowersCountAPIView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Get followers count for a user",
        manual_parameters=[
            openapi.Parameter(
                "user_id",
                openapi.IN_PATH,
                description="User ID whose followers count is required",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "followers": openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                        description="Total followers count"
                    )
                }
            )
        },
    )
    def get(self, request, user_id):
        count = FollowRequest.objects.filter(
            following_id=user_id,
            status="ACCEPTED"
        ).count()

        return Response({"followers": count})



class FollowingCountAPIView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Get following count for a user",
        manual_parameters=[
            openapi.Parameter(
                "user_id",
                openapi.IN_PATH,
                description="User ID whose following count is required",
                type=openapi.TYPE_INTEGER,
                required=True,
            )
        ],
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "following": openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                        description="Total following count"
                    )
                }
            )
        },
    )
    def get(self, request, user_id):
        count = FollowRequest.objects.filter(
            follower_id=user_id,
            status="ACCEPTED"
        ).count()

        return Response({"following": count})

