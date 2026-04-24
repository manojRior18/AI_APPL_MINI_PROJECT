import os
import hashlib
import hmac
import json
import base64
import time
from typing import Optional

SECRET_KEY = os.getenv("SECRET_KEY", "gst-helper-ai-secret-change-in-production")


def hash_password(password: str) -> str:
    """SHA-256 based password hashing (use bcrypt in production)."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify a plain password against the stored hash."""
    try:
        salt, hashed = stored_hash.split(":", 1)
        check = hashlib.sha256((salt + plain_password).encode()).hexdigest()
        return hmac.compare_digest(check, hashed)
    except Exception:
        return False


def create_token(user_id: int, email: str, business_name: str) -> str:
    """
    Creates a simple base64-encoded token (JWT-like).
    Replace with python-jose or PyJWT in production.
    """
    payload = {
        "user_id": user_id,
        "email": email,
        "business_name": business_name,
        "exp": int(time.time()) + 86400  # 24-hour expiry
    }
    token_bytes = json.dumps(payload).encode()
    return base64.urlsafe_b64encode(token_bytes).decode()


def decode_token(token: str) -> Optional[dict]:
    """Decodes and validates a token."""
    try:
        payload = json.loads(base64.urlsafe_b64decode(token.encode()).decode())
        if payload.get("exp", 0) < time.time():
            return None  # Expired
        return payload
    except Exception:
        return None