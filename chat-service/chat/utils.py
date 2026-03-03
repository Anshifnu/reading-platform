import requests
from .models import ChatParticipant

CHAT_COST = 10
WALLET_DEDUCT_API = "http://follow-service/api/wallet/deduct/"

def deduct_coin(room_id, sender_id):
    """
    Deduct 10 coins from reader and credit author
    """

    receiver = ChatParticipant.objects.filter(
        room_id=room_id
    ).exclude(user_id=sender_id).first()

    if not receiver:
        return

    payload = {
        "amount": CHAT_COST,
        "author_id": receiver.user_id
    }

    requests.post(
        WALLET_DEDUCT_API,
        json=payload
    )
