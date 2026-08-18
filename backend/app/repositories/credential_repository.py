from sqlmodel import Session, select

from app.models.credential import StaffCredential


class CredentialRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_code(self, code: str) -> StaffCredential | None:
        return self.session.exec(
            select(StaffCredential).where(StaffCredential.code == code)
        ).first()

    def save(self, credential: StaffCredential) -> StaffCredential:
        self.session.add(credential)
        self.session.commit()
        self.session.refresh(credential)
        return credential
