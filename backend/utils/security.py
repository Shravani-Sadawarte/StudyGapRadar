import hashlib
import hmac
import os
import base64
import json
import time
from typing import Optional, Dict, Any
from backend.config import settings

def hash_password(password: str) -> str:
    """Securely hash a password using PBKDF2-HMAC-SHA256 with salt."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{base64.b64encode(salt).decode('ascii')}${base64.b64encode(dk).decode('ascii')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salt$hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 2:
            return False
        salt = base64.b64decode(parts[0].encode("ascii"))
        expected_dk = base64.b64decode(parts[1].encode("ascii"))
        actual_dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
        return hmac.compare_digest(expected_dk, actual_dk)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    """Create a signed, tamper-proof token using HMAC-SHA256."""
    expires = time.time() + (expires_delta_seconds or (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
    payload = {
        "sub": data.get("sub"),
        "email": data.get("email"),
        "exp": expires,
        "iat": time.time()
    }
    payload_json = json.dumps(payload, sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("ascii").rstrip("=")
    
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
    
    return f"{payload_b64}.{sig_b64}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify signature and expiration of an access token."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig_b64 = parts
        
        # Verify signature
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode("ascii").rstrip("=")
        
        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None
            
        # Re-add padding if needed
        padding = "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = base64.urlsafe_b64decode((payload_b64 + padding).encode("ascii")).decode("utf-8")
        payload = json.loads(payload_json)
        
        if payload.get("exp") and time.time() > payload["exp"]:
            return None  # Expired
            
        return payload
    except Exception:
        return None
