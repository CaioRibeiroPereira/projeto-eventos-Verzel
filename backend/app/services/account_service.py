import secrets

from fastapi import HTTPException, status

from app.core.cards import detect_brand
from app.core.security import hash_password, verify_password
from app.models.payment_card import PaymentCard
from app.models.user import User
from app.repositories.card_repository import CardRepository
from app.repositories.user_repository import UserRepository
from app.schemas.account import AddCardRequest, ChangePasswordRequest, UpdateProfileRequest


class AccountService:
    def __init__(self, users: UserRepository, cards: CardRepository):
        self.users = users
        self.cards = cards

    def update_profile(self, user: User, data: UpdateProfileRequest) -> User:
        existing = self.users.get_by_email(data.email)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já em uso")
        user.name = data.name
        user.email = data.email
        return self.users.save(user)

    def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta")
        if len(data.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova senha precisa ter ao menos 8 caracteres",
            )
        user.password_hash = hash_password(data.new_password)
        self.users.save(user)

    def list_cards(self, user: User) -> list[PaymentCard]:
        return self.cards.list_for_user(user.id)

    def add_card(self, user: User, data: AddCardRequest) -> PaymentCard:
        digits = "".join(c for c in data.number if c.isdigit())
        if len(digits) < 12:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Número de cartão inválido")
        card = PaymentCard(
            user_id=user.id,
            brand=detect_brand(digits),
            last4=digits[-4:],
            holder_name=data.holder_name,
            expiry=data.expiry,
        )
        return self.cards.create(card)

    def remove_card(self, user: User, card_id: int) -> None:
        card = self.cards.get(card_id)
        if not card or card.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cartão não encontrado")
        self.cards.delete(card)

    def delete_account(self, user: User) -> None:
        """Desativa e anonimiza a conta em vez de apagar a linha: reservas e
        ingressos já emitidos continuam íntegros para a portaria e o
        histórico, mas a pessoa não consegue mais logar nem fica com dados
        reais visíveis."""
        user.name = "Conta removida"
        user.email = f"conta-removida-{user.id}-{secrets.token_hex(4)}@cineverzel.local"
        user.password_hash = hash_password(secrets.token_urlsafe(32))
        user.is_active = False
        self.users.save(user)
