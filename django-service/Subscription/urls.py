from django.urls import path
from .views import CreateSubscriptionOrder,SubscriptionPlanListView,VerifySubscriptionPayment,UserSubscriptionStatusView
from .views import AddCoinView,VerifyCoinView
urlpatterns = [
    path("subscriptions/plans/", SubscriptionPlanListView.as_view()),
    path("subscriptions/create-order/", CreateSubscriptionOrder.as_view()),
    path("subscriptions/verify/", VerifySubscriptionPayment.as_view()),
    path("subscriptions/status/", UserSubscriptionStatusView.as_view()),
    path("wallet/add-coins/", AddCoinView.as_view(), name="add-coins"),
    path("wallet/verify-coins/", VerifyCoinView.as_view(), name="verify-coins"),
]
