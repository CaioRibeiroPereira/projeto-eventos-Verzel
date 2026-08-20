"""Garantia: o QR não pode ser forjado (requisito crítico #2).

`sign_ticket` gera um HMAC-SHA256 do id do ingresso com um segredo que só o
servidor conhece; `verify_ticket` recalcula e compara. Sem o segredo,
ninguém consegue montar uma assinatura que bata.
"""

from app.core.qr import (
    MANUAL_CODE_ALPHABET,
    generate_manual_code,
    normalize_manual_code,
    parse_ticket_payload,
    sign_ticket,
    ticket_payload,
    verify_ticket,
)


def test_verify_accepts_a_genuinely_signed_ticket():
    signature = sign_ticket(42)
    assert verify_ticket(42, signature) is True


def test_verify_rejects_signature_for_a_different_ticket_id():
    signature = sign_ticket(42)
    assert verify_ticket(43, signature) is False


def test_verify_rejects_a_tampered_signature():
    signature = sign_ticket(42)
    tampered = ("0" if signature[0] != "0" else "1") + signature[1:]
    assert verify_ticket(42, tampered) is False


def test_verify_rejects_garbage_signature():
    assert verify_ticket(42, "isso-nao-e-um-hmac-valido") is False


def test_ticket_payload_roundtrip_via_qr():
    payload = ticket_payload(42, sign_ticket(42))
    parsed = parse_ticket_payload(payload)
    assert parsed is not None
    ticket_id, signature = parsed
    assert ticket_id == 42
    assert verify_ticket(ticket_id, signature) is True


def test_parse_ticket_payload_rejects_malformed_input():
    assert parse_ticket_payload("nao-tem-dois-pontos") is None
    assert parse_ticket_payload("abc:sig") is None  # id não numérico
    assert parse_ticket_payload("1:2:3") is None  # partes demais


def test_manual_code_has_no_visually_ambiguous_characters():
    code = generate_manual_code()
    assert len(code) == 8
    assert all(ch in MANUAL_CODE_ALPHABET for ch in code)
    for ambiguous in "0O1IL":
        assert ambiguous not in code


def test_normalize_manual_code_ignores_case_dashes_and_spaces():
    code = generate_manual_code()
    formatted = f"{code[:4]}-{code[4:]}".lower()
    assert normalize_manual_code(f" {formatted} ") == code
