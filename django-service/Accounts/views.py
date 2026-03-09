import uuid, random
import json
from django.core.cache import cache
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterRequestSerializer,VerifyOTPSerializer,LoginSerializer,OTPVerifySerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone
import time
from google.oauth2 import id_token
from google.auth.transport import requests
from .utils import (
    generate_otp,
    store_otp,
    delete_otp,
    send_otp_email,
    get_otp,
    send_sqs_email,
)

from django.contrib.auth import get_user_model
User=get_user_model()

class EmailRegister(APIView):

    def post(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp = str(random.randint(100000, 999999))
        registration_id = str(uuid.uuid4())

        cache.set(
            registration_id,
            {
                **serializer.validated_data,
                "otp": otp,
                "otp_created_at": timezone.now().timestamp(),
                "otp_attempts": 0,
                "resend_count": 0,
            },
            timeout=300
        )

        # ✅ SEND TO SQS (USING NEW GENERIC METHOD)
        subject = "Your BookSphere Registration OTP"
        message_body = f"Your registration OTP is {otp}. It expires in a few minutes."
        send_sqs_email(serializer.validated_data["email"], subject, message_body)

        return Response(
            {
                "message": "OTP sent to email",
                "registration_id": registration_id
            },
            status=status.HTTP_200_OK
        )




class VerifyEmailOTP(APIView):
    @swagger_auto_schema(
        operation_description="Verify Email OTP",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'registration_id': openapi.Schema(type=openapi.TYPE_STRING),
                'otp': openapi.Schema(type=openapi.TYPE_STRING),
            }
        )
    )
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        registration_id = serializer.validated_data["registration_id"]
        otp = serializer.validated_data["otp"]

        cached_data = cache.get(registration_id)

        if not cached_data:
            return Response(
                {"error": "Registration session expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        OTP_EXPIRY_SECONDS = 30
        MAX_OTP_ATTEMPTS = 3

        
        elapsed = time.time() - cached_data["otp_created_at"]
        if elapsed > OTP_EXPIRY_SECONDS:
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        if cached_data["otp_attempts"] >= MAX_OTP_ATTEMPTS:
            cache.delete(registration_id)
            return Response(
                {"error": "Too many invalid attempts. Please register again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        if cached_data["otp"] != otp:
            cached_data["otp_attempts"] += 1
            cache.set(registration_id, cached_data) 
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        
        user = User.objects.create_user(
            username=cached_data["username"],
            email=cached_data["email"],
            phone_number=cached_data["phone_number"],
            password=cached_data["password"],
            role=cached_data.get("role", "reader"),
            is_email_verified=True,
            is_active=True
        )

        cache.delete(registration_id)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Registration successful",
                "user": {
                    "id":user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "role": user.role
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }
            },
            status=status.HTTP_201_CREATED
        )

    

class ResendEmailOTP(APIView):
    @swagger_auto_schema(
        operation_description="Resend Email OTP",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'registration_id': openapi.Schema(type=openapi.TYPE_STRING),
            }
        )
    )
    def post(self, request):
        registration_id = request.data.get("registration_id")
        cached_data = cache.get(registration_id)

        if not cached_data:
            return Response(
                {"error": "Registration session expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        MAX_RESEND = 3

        if cached_data["resend_count"] >= MAX_RESEND:
            return Response(
                {"error": "Resend limit exceeded"},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_otp = str(random.randint(100000, 999999))

        cached_data.update({
            "otp": new_otp,
            "otp_created_at": timezone.now().timestamp(),
            "otp_attempts": 0,
            "resend_count": cached_data["resend_count"] + 1,
        })

        cache.set(registration_id, cached_data)  

        subject = "Verify your email"
        body = f"Your new OTP is {new_otp}"
        send_sqs_email(cached_data["email"], subject, body)

        return Response(
            {"message": "OTP resent successfully"},
            status=status.HTTP_200_OK
        )



    

class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Email Registration",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        )
    )

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.validated_data["user"]

        otp = generate_otp()
        store_otp(user.email, otp)
        send_otp_email(user.email, otp)

        return Response(
            {
                "message": "OTP sent to email",
                "email": user.email,
                "expires_in": 60
            },
            status=200
        )
    

class OTPVerifyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Email Registration",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'otp': openapi.Schema(type=openapi.TYPE_STRING),
                
            }
        )
    )

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.validated_data["user"]

        delete_otp(user.email)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id":user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=200
        )



class LogoutView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Logout user by blacklisting refresh token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description="Refresh token to blacklist"),
            },
            required=['refresh']
        ),
        responses={205: "Logout successful", 400: "Invalid token"}
    )
    def post(self, request):
        try:
            refresh = request.data.get("refresh")
            if not refresh:
                return Response(
                    {"error": "Refresh token required"},
                    status=400
                )

            token = RefreshToken(refresh)
            token.blacklist()

            return Response(
                {"message": "Logout successful"},
                status=205
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired token"},
                status=400
            )
        




class ForgotPasswordView(APIView):
    @swagger_auto_schema(
        operation_description="Verify Email OTP",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING),
            }
        )
    )
    def post(self, request):
        email = request.data.get("email")

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Email not registered"},
                status=status.HTTP_404_NOT_FOUND
            )

        otp = str(random.randint(100000, 999999))
        reset_token = str(uuid.uuid4())

        # store everything in cache
        cache.set(f"fp_email_{reset_token}", email, timeout=600)
        cache.set(f"fp_otp_{reset_token}", otp, timeout=300)

        subject = "Password Reset OTP"
        body = f"Your OTP for password reset is {otp}"
        send_sqs_email(email, subject, body)

        return Response({
            "message": "OTP sent",
            "reset_token": reset_token   
        })


class VerifyForgotPasswordOTPView(APIView):
    @swagger_auto_schema(
        operation_description="Verify Email OTP",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'otp': openapi.Schema(type=openapi.TYPE_STRING),
                'reset_token': openapi.Schema(type=openapi.TYPE_STRING),
            }
        )
    )
    def post(self, request):
        otp = request.data.get("otp")
        reset_token = request.data.get("reset_token")

        if not otp or not reset_token:
            return Response(
                {"error": "OTP and token required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cached_otp = cache.get(f"fp_otp_{reset_token}")

        if not cached_otp:
            return Response(
                {"error": "OTP expired or invalid"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cached_otp != otp:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

       
        cache.set(f"fp_verified_{reset_token}", True, timeout=300)

        return Response({"message": "OTP verified"})

    

class ResetPasswordView(APIView):
    @swagger_auto_schema(
        operation_description="Verify Email OTP",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'reset_token': openapi.Schema(type=openapi.TYPE_STRING),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING),
                
            }
        )
    )
    def post(self, request):
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")
        reset_token = request.data.get("reset_token")

        if not reset_token:
            return Response(
                {"error": "Invalid request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )

        verified = cache.get(f"fp_verified_{reset_token}")
        if not verified:
            return Response(
                {"error": "OTP not verified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = cache.get(f"fp_email_{reset_token}")
        if not email:
            return Response(
                {"error": "Session expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()

        
        cache.delete(f"fp_email_{reset_token}")
        cache.delete(f"fp_otp_{reset_token}")
        cache.delete(f"fp_verified_{reset_token}")

        return Response({"message": "Password reset successful"})


class GoogleLoginView(APIView):
    @swagger_auto_schema(
        operation_description="Login with Google ID Token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'token': openapi.Schema(type=openapi.TYPE_STRING, description="Google ID Token"),
            },
            required=['token']
        ),
        responses={200: "Login successful", 400: "Invalid token"}
    )
    def post(self, request):
        token = request.data.get("token")

        try:
            info = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                "244903806108-lmovisf9emd2ds1375u4rdrq4fbl1frb.apps.googleusercontent.com"
            )
        except ValueError:
            return Response({"error": "Invalid token"}, status=400)

        email = info["email"]
        name = info.get("name")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email, "first_name": name}
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            "user": {
                "email": user.email,
                "username": user.first_name,
            }
})


class AdminDashboardStatsView(APIView):
    """
    Returns real-time platform statistics for the admin dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only allow admin users
        if request.user.role != "admin":
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        from Books.models import Book
        from Subscription.models import UserSubscription

        total_users = User.objects.count()
        total_readers = User.objects.filter(role="reader").count()
        total_authors = User.objects.filter(role="author").count()
        total_books = Book.objects.count()

        # Subscription stats
        active_subscriptions = UserSubscription.objects.filter(is_active=True)
        total_subscribed = active_subscriptions.count()
        monthly_subscriptions = active_subscriptions.filter(
            plan__plan_type="monthly"
        ).count()
        yearly_subscriptions = active_subscriptions.filter(
            plan__plan_type="yearly"
        ).count()

        return Response({
            "total_users": total_users,
            "total_readers": total_readers,
            "total_authors": total_authors,
            "total_books": total_books,
            "total_subscribed": total_subscribed,
            "monthly_subscriptions": monthly_subscriptions,
            "yearly_subscriptions": yearly_subscriptions,
        })
