import os
import requests
from dotenv import load_dotenv

# ✅ Load .env file
load_dotenv()

DJANGO_API_BASE = os.getenv("DJANGO_API_BASE")


def fetch_books():
    if not DJANGO_API_BASE:
        raise Exception("DJANGO_API_BASE is not set in .env file")

    url = f"{DJANGO_API_BASE}/books/"
    print("📡 Calling Django API:", url)

    res = requests.get(url, timeout=10)
    res.raise_for_status()

    data = res.json()
    return data.get("results", data)

