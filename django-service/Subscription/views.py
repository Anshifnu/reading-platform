# views.py
import razorpay
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SubscriptionPlan
from django.utils import timezone
from .models import UserSubscription
from rest_framework import status
from firebase_admin import messaging
from Notifications.models import DeviceToken

client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer
from Notifications.models import Notification
from FollowSystem.models import ReaderWallet
from django.db import transaction
from FollowSystem.models import ReaderWallet 
from Notifications.models import Notification                                                                                                                

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class SubscriptionPlanListView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Get list of active subscription plans",
        responses={200: SubscriptionPlanSerializer(many=True)},
    )
    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True)
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)





class CreateSubscriptionOrder(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Create Razorpay order for subscription plan",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["plan_type"],
            properties={
                "plan_type": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Subscription plan type (e.g. MONTHLY, YEARLY)"
                )
            }
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "order_id": openapi.Schema(type=openapi.TYPE_STRING),
                    "amount": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "key": openapi.Schema(type=openapi.TYPE_STRING),
                    "plan": openapi.Schema(type=openapi.TYPE_STRING),
                }
            ),
            400: openapi.Response(description="Invalid plan type"),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def post(self, request):
        plan_type = request.data.get("plan_type")

        plan = SubscriptionPlan.objects.get(plan_type=plan_type)

        order = client.order.create({
            "amount": plan.price * 100,  # paise
            "currency": "INR",
            "payment_capture": 1
        })

        return Response({
            "order_id": order["id"],
            "amount": plan.price,
            "key": settings.RAZORPAY_KEY_ID,
            "plan": plan_type
        })




class VerifySubscriptionPayment(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Verify Razorpay payment and activate subscription",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[
                "razorpay_payment_id",
                "razorpay_order_id",
                "plan_type",
            ],
            properties={
                "razorpay_payment_id": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Razorpay payment ID"
                ),
                "razorpay_order_id": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Razorpay order ID"
                ),
                "plan_type": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Subscription plan type (monthly / yearly)"
                ),
            }
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "message": openapi.Schema(type=openapi.TYPE_STRING),
                    "coins_added": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "wallet_balance": openapi.Schema(type=openapi.TYPE_INTEGER),
                }
            ),
            400: openapi.Response(description="Invalid request / plan"),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def post(self, request):
        payment_id = request.data.get("razorpay_payment_id")
        order_id = request.data.get("razorpay_order_id")
        plan_type = request.data.get("plan_type")

        plan = SubscriptionPlan.objects.get(plan_type=plan_type)

        with transaction.atomic():
            UserSubscription.objects.create(
                user=request.user,
                plan=plan,
                razorpay_payment_id=payment_id,
                razorpay_order_id=order_id,
            )

            user = request.user
            user.has_permission = True
            user.save(update_fields=["has_permission"])

            coins_to_add = 100 if plan.plan_type == "monthly" else 1210

            wallet, _ = ReaderWallet.objects.get_or_create(
                user_id=user.id,
                defaults={"balance": 0}
            )

            wallet.balance += coins_to_add
            wallet.save(update_fields=["balance"])

            Notification.objects.filter(
                user=user,
                type__in=["SUB_EXPIRING", "SUB_EXPIRED"],
                is_active=True
            ).update(is_active=False)

            Notification.objects.create(
                user=user,
                type="SUB_RENEWED",
                title="Subscription activated",
                message=f"Your subscription is active. {coins_to_add} coins added 🎉"
            )

            # Send Firebase Push Notification
            tokens = DeviceToken.objects.filter(user=user).values_list("token", flat=True)
            for token in tokens:
                try:
                    message = messaging.Message(
                        data={
                            "title": "Subscription activated",
                            "body": f"Your subscription is active. {coins_to_add} coins added 🎉",
                            "type": "SUB_RENEWED",
                            "coins_added": str(coins_to_add),
                        },
                        token=token,
                    )
                    messaging.send(message)
                except Exception:
                    DeviceToken.objects.filter(token=token).delete()

            # Send Firebase Push Notification
            tokens = DeviceToken.objects.filter(user=user).values_list("token", flat=True)
            for token in tokens:
                try:
                    message = messaging.Message(
                        data={
                            "title": "Subscription activated",
                            "body": f"Your subscription is active. {coins_to_add} coins added 🎉",
                            "type": "SUB_RENEWED",
                            "coins_added": str(coins_to_add),
                        },
                        token=token,
                    )
                    messaging.send(message)
                except Exception:
                    DeviceToken.objects.filter(token=token).delete()

        return Response({
            "message": "Subscription activated",
            "coins_added": coins_to_add,
            "wallet_balance": wallet.balance
        })






class UserSubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get current active subscription status of the logged-in user",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "active_plan": openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        nullable=True,
                        properties={
                            "plan_type": openapi.Schema(type=openapi.TYPE_STRING),
                            "name": openapi.Schema(type=openapi.TYPE_STRING),
                            "end_date": openapi.Schema(
                                type=openapi.TYPE_STRING,
                                format="date-time"
                            ),
                        },
                        description="Active subscription plan details or null"
                    )
                }
            ),
            401: openapi.Response(description="Unauthorized"),
        },
        security=[{"Bearer": []}],
    )
    def get(self, request):
        active_sub = UserSubscription.objects.filter(
            user=request.user,
            is_active=True
        ).order_by("-plan__price").first()

        if not active_sub:
            return Response({"active_plan": None})

        return Response({
            "active_plan": {
                "plan_type": active_sub.plan.plan_type,
                "end_date": active_sub.end_date,
                "name": active_sub.plan.name
            }
        })



class AddCoinView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Create coin purchase order",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["plan"],
            properties={
                "plan": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    example="500_COINS"
                )
            }
        ),
        responses={201: "Order created"},
        tags=["Wallet / Coins"]
    )
    def post(self, request):
        plan = request.data.get("plan")

        PLAN_MAP = {
            "100_COINS": {"coins": 100, "amount": 9},
            "500_COINS": {"coins": 500, "amount": 39},
            "2000_COINS": {"coins": 2000, "amount": 99},
        }

        if plan not in PLAN_MAP:
            return Response(
                {"error": "Invalid plan"},
                status=status.HTTP_400_BAD_REQUEST
            )

        amount_paise = PLAN_MAP[plan]["amount"] * 100

        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
        })

        return Response(
            {
                "order_id": order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "razorpay_key": settings.RAZORPAY_KEY_ID,
                "coins": PLAN_MAP[plan]["coins"]
            },
            status=status.HTTP_201_CREATED
        )
    







class VerifyCoinView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Verify payment and add coins",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[
                "razorpay_order_id",
                "razorpay_payment_id",
                "razorpay_signature",
                "coins"
            ],
            properties={
                "razorpay_order_id": openapi.Schema(type=openapi.TYPE_STRING),
                "razorpay_payment_id": openapi.Schema(type=openapi.TYPE_STRING),
                "razorpay_signature": openapi.Schema(type=openapi.TYPE_STRING),
                "coins": openapi.Schema(type=openapi.TYPE_INTEGER, example=500),
            }
        ),
        responses={200: "Coins added"},
        tags=["Wallet / Coins"]
    )
    def post(self, request):
        data = request.data

        # 1️⃣ Verify Razorpay signature
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": data["razorpay_order_id"],
                "razorpay_payment_id": data["razorpay_payment_id"],
                "razorpay_signature": data["razorpay_signature"],
            })
        except razorpay.errors.SignatureVerificationError:
            return Response(
                {"error": "Payment verification failed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        coins = int(data["coins"])

        # 2️⃣ Update wallet
        wallet, _ = ReaderWallet.objects.get_or_create(
            user_id=request.user.id
        )
        wallet.balance += coins
        wallet.save()

        # 3️⃣ CREATE NOTIFICATION 👇 (THIS IS THE ANSWER)
        Notification.objects.create(
            user=request.user,
            type="COINS_ADDED",
            title="Coins added successfully 🎉",
            message=f"{coins} coins have been added to your wallet.",
            related_object_id=wallet.id
        )

        tokens = DeviceToken.objects.filter(user=request.user).values_list("token", flat=True)

        for token in tokens:
            try:
                message = messaging.Message(
                    data={
                        "title": "Coins added successfully 🎉",
                        "body": f"{coins} coins have been added to your wallet.",
                        "type": "COINS_ADDED",
                        "coins": str(coins),
                    },
                    token=token,
                )


                messaging.send(message)

            except Exception:
                # If token invalid → remove it
                DeviceToken.objects.filter(token=token).delete()

        # 4️⃣ Response
        return Response(
            {
                "message": "Coins added successfully",
                "balance": wallet.balance
            },
            status=status.HTTP_200_OK
        )

