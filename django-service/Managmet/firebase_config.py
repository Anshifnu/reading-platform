import firebase_admin
from firebase_admin import credentials

import os

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            print(f"Warning: Firebase service account key not found at {cred_path}. Skipping Firebase initialization.")
