from sqlmodel import Session, select

from app.models.contact_message import ContactMessage


class ContactMessageRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, message: ContactMessage) -> ContactMessage:
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def list_all(self) -> list[ContactMessage]:
        return list(
            self.session.exec(
                select(ContactMessage).order_by(ContactMessage.created_at.desc())
            )
        )
