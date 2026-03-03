from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import EmailRegister,VerifyEmailOTP,ResendEmailOTP
from .views import ForgotPasswordView,VerifyForgotPasswordOTPView,ResetPasswordView,GoogleLoginView
from .views import LoginView,OTPVerifyView,LogoutView
from .views import AdminDashboardStatsView

urlpatterns = [
    path('email-register/',EmailRegister.as_view(),name="register"),
    path('email-verify/',VerifyEmailOTP.as_view(),name="verify"),
    path('resend-email-otp/',ResendEmailOTP.as_view()),
    path("login/", LoginView.as_view()),
    path("verify-otp/", OTPVerifyView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("google-login/", GoogleLoginView.as_view()),
    

    path("forgot-password/", ForgotPasswordView.as_view()),
    path("verify-forgot-otp/", VerifyForgotPasswordOTPView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),

    path("admin-stats/", AdminDashboardStatsView.as_view(), name="admin-stats"),

]

