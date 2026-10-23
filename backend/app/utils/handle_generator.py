import secrets
from sqlalchemy.orm import Session
from app.models.entities import User

ADJECTIVES = [
    "Brave", "Silent", "Guardian", "SafeVoice", "Steady", "Quiet", "Firm", "Bold", "Calm", "Vigilant"
]

def generate_unique_handle(db: Session) -> str:
    """
    Generates a random, non-identifying handle at registration time, e.g. 'SafeVoice_4821'.
    This is the ONLY name shown next to a community post or comment.
    """
    while True:
        adj = secrets.choice(ADJECTIVES)
        suffix = secrets.randbelow(9000) + 1000  # 4-digit random number
        handle = f"{adj}_{suffix}"
        exists = db.query(User).filter(User.anonymous_handle == handle).first()
        if not exists:
            return handle
