from rest_framework import serializers
from .models import FollowRequest
from .models import ReaderWallet, CoinTransaction, AuthorEarning
from Accounts.models import User

class FollowRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowRequest
        fields = "__all__"
        read_only_fields = ("status",)




class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReaderWallet
        fields = "__all__"


class CoinTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinTransaction
        fields = "__all__"


class AuthorEarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorEarning
        fields = "__all__"




class AuthorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]