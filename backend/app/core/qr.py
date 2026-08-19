import hashlib
import hmac
import secrets

from app.core.config import settings


def sign_ticket(ticket_id: int) -> str:
    return hmac.new(
        settings.ticket_secret.encode(), str(ticket_id).encode(), hashlib.sha256
    ).hexdigest()


def verify_ticket(ticket_id: int, signature: str) -> bool:
    return hmac.compare_digest(sign_ticket(ticket_id), signature)


def generate_share_token() -> str:
    return secrets.token_urlsafe(24)


# Exclui caracteres ambíguos (0/O, 1/I/L) pra reduzir erro de digitação manual na portaria.
MANUAL_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def generate_manual_code() -> str:
    return "".join(secrets.choice(MANUAL_CODE_ALPHABET) for _ in range(8))


def format_manual_code(code: str) -> str:
    return f"{code[:4]}-{code[4:]}"


def normalize_manual_code(raw: str) -> str:
    return raw.strip().upper().replace("-", "").replace(" ", "")


def ticket_payload(ticket_id: int, signature: str) -> str:
    return f"{ticket_id}:{signature}"


def parse_ticket_payload(payload: str) -> tuple[int, str] | None:
    parts = payload.strip().split(":")
    if len(parts) != 2 or not parts[0].isdigit():
        return None
    return int(parts[0]), parts[1]
