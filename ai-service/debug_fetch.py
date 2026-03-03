import os
import requests
from dotenv import load_dotenv

load_dotenv("d:\\BookSpHere\\booksphere-ai-service\\.env")

DJANGO_API_BASE = os.getenv("DJANGO_API_BASE", "http://localhost:8000/api")

def fetch_books():
    url = f"{DJANGO_API_BASE}/books/"
    print("Calling Django API:", url)
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()
        books = data.get("results", data)
        print(f"Fetched {len(books)} books.")
        for b in books:
            print(f"Title: {b['title']}")
            print(f"   Categories: {b.get('categories')}")
            print(f"   Rating: {b.get('average_rating')}")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_books()
