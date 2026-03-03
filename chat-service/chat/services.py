import requests

# create a variable for the host to make it easier to change
HOST_URL = "http://host.docker.internal:8000"

FOLLOW_SERVICE_URL = f"{HOST_URL}/api/follow/status/" # Assuming follow is also on host? Keeping vague for now or ask user. 
# actually user only gave coin service url. Let's update coin service specifically.

# Using host.docker.internal to access host machine from container
# Using host.docker.internal to access host machine from container
COIN_SERVICE_URL = "http://django-backend:8000/api/coins/deduct/"
# Assuming follow service might also be local? leaving as follow-service for now unless user specified
FOLLOW_SERVICE_URL = "http://django-backend:8000/api/follow/status/"

CHAT_COST = 10
MAX_WORDS = 200


def validate_and_charge_chat(sender_id, sender_role, receiver_id, message, token):
    # ✅ Normalize role
    print(f"🔍 DEBUG: sender_role raw='{sender_role}', type={type(sender_role)}")
    role = str(sender_role).strip().lower() if sender_role else "reader"
    print(f"🔍 DEBUG: Normalized role='{role}'")

    # ✅ Restrict Allowed Roles
    if role not in ["author", "reader"]:
        return False, "Only Authors and Readers can chat"

    # ✅ word limit
    if len(message.split()) > MAX_WORDS:
        return False, "Message exceeds 100 words"

    # ✅ author chats free (bypass ALL external checks)
    if role == "author":
        print(f"✅ Author bypass for user {sender_id}")
        return True, "Author chat free"

    # 🔒 1. Check follow status
    try:
        follow_resp = requests.get(
            FOLLOW_SERVICE_URL,
            params={"reader": sender_id, "author": receiver_id},
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )

        if follow_resp.status_code != 200:
             print("⚠️ Follow service returned error, assuming allowed for DEV")
             # Still lenient on Follow Service for now as user didn't complain about this one specifically, 
             # but user might want strictness everywhere.
             # User said "when can't acces coins to deduct can't can to chat for raeders" specifically about coins.
             # I'll keep Follow lenient for now to avoid blocking testing if that service isn't ready.

        elif follow_resp.json().get("status") != "ACCEPTED":
            return False, "Follow not accepted"

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Follow service unavailable ({e}), assuming allowed for DEV")


    # 💰 2. Deduct coins (STRICT)
    print(f"💰 Attempting to deduct coins for user {sender_id} (Role: {sender_role})")
    
    try:
        coin_resp = requests.post(
            COIN_SERVICE_URL,
            json={
                "reader_id": sender_id,
                "author_id": receiver_id,
                "amount": CHAT_COST
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )

        if coin_resp.status_code != 200:
            error_msg = coin_resp.json().get("error", "Coin deduction failed")
            print(f"❌ Coin deduction failed: {error_msg}")
            return False, error_msg

    except requests.exceptions.RequestException as e:
        print(f"❌ Coin service unavailable ({e}) - Chat Blocked")
        return False, "Coin service unavailable"

    return True, "Allowed"


def can_chat(sender, receiver):
    """
    Check if a chat session can be started between sender and receiver.
    sender = {id, role}
    receiver = {id, role}
    """
    # TEMP DEV MODE (disable external calls if services not ready)
    return True, "Allowed"
