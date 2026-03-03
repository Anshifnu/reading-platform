from rest_framework import serializers
from django.contrib.auth import authenticate,get_user_model
from .utils import (
    get_otp,
)

User = get_user_model()

class RegisterRequestSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3)
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    role = serializers.ChoiceField(choices=["reader", "author"], default="reader")
    password = serializers.CharField(min_length=6, write_only=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")

        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError("Email already registered")
        
        if User.objects.filter(phone_number=attrs["phone_number"]).exists():
            raise serializers.ValidationError("Number already registered")

        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError("Username already taken")

        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    registration_id = serializers.UUIDField()  
    otp = serializers.CharField()

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "phone_number",
            "password",
            "confirm_password",
        )
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            phone_number=validated_data["phone_number"],
            password=validated_data["password"],
            is_active=False,
            is_phone_verified=False,
        )
        return user
    


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("email does not exist")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid password")

        if not user.is_active:
            raise serializers.ValidationError("User not verified")

        attrs["user"] = user
        return attrs


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs["email"]
        otp = attrs["otp"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email")

        cached_otp = get_otp(email)

        if not cached_otp:
            raise serializers.ValidationError("OTP expired")

        if cached_otp != otp:
            raise serializers.ValidationError("Invalid OTP")

        attrs["user"] = user
        return attrs

