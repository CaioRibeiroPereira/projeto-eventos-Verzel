def detect_brand(digits: str) -> str:
    """Heurística simples de bandeira a partir do prefixo do número.
    Cobre as bandeiras mais comuns no Brasil e internacionais."""
    if digits.startswith(("34", "37")):
        return "American Express"
    if digits.startswith(("4011", "4312", "4389", "4514", "4573", "6362", "6363")):
        return "Elo"
    if digits.startswith(("606282", "3841")):
        return "Hipercard"
    if digits.startswith("4"):
        return "Visa"
    if digits[:2].isdigit() and 51 <= int(digits[:2]) <= 55:
        return "Mastercard"
    if digits[:4].isdigit() and 2221 <= int(digits[:4]) <= 2720:
        return "Mastercard"
    return "Cartão"
