from app.models.contact_message import ContactMessage
from app.repositories.contact_message_repository import ContactMessageRepository
from app.schemas.contact_message import ContactMessageCreate


class ContactService:
    def __init__(self, repository: ContactMessageRepository):
        self.repository = repository

    def send(self, data: ContactMessageCreate) -> ContactMessage:
        message = ContactMessage(
            name=data.name,
            email=data.email,
            company=data.company,
            message=data.message,
            origin=data.origin,
        )
        return self.repository.create(message)

    def list_messages(self) -> list[ContactMessage]:
        return self.repository.list_all()
