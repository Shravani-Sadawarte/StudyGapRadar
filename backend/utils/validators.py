import re
from typing import Optional

def validate_email(email: str) -> bool:
    regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(regex, email))

def sanitize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    # Normalize multiple whitespaces, carriage returns, and tabs
    cleaned = re.sub(r"\r\n", "\n", text)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()
