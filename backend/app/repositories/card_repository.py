from sqlmodel import Session, select

from app.models.payment_card import PaymentCard


class CardRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_for_user(self, user_id: int) -> list[PaymentCard]:
        return list(
            self.session.exec(
                select(PaymentCard)
                .where(PaymentCard.user_id == user_id)
                .order_by(PaymentCard.created_at)
            )
        )

    def get(self, card_id: int) -> PaymentCard | None:
        return self.session.get(PaymentCard, card_id)

    def create(self, card: PaymentCard) -> PaymentCard:
        self.session.add(card)
        self.session.commit()
        self.session.refresh(card)
        return card

    def delete(self, card: PaymentCard) -> None:
        self.session.delete(card)
        self.session.commit()
