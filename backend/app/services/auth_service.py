from datetime import datetime

from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.credential_repository import CredentialRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import CredentialRegisterRequest, LoginRequest, Token, UserCreate


class AuthService:
    def __init__(self, repository: UserRepository, credentials: CredentialRepository):
        self.repository = repository
        self.credentials = credentials

    def register(self, data: UserCreate) -> User:
        if self.repository.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já cadastrado",
            )
        user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=UserRole.customer,
        )
        return self.repository.create(user)

    def register_with_credential(self, data: CredentialRegisterRequest, expected_role: UserRole) -> User:
        credential = self.credentials.get_by_code(data.code.strip().upper())
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credencial não encontrada",
            )
        if credential.role != expected_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Essa credencial não é válida para este cadastro",
            )
        if credential.used_by_user_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Credencial já utilizada",
            )
        if self.repository.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já cadastrado",
            )
        user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=expected_role,
        )
        user = self.repository.create(user)
        credential.used_by_user_id = user.id
        credential.used_at = datetime.utcnow()
        self.credentials.save(credential)
        return user

    def login(self, data: LoginRequest) -> Token:
        user = self.repository.get_by_email(data.email)
        if not user or not user.is_active or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos",
            )
        token = create_access_token(user.id, user.role)
        return Token(access_token=token)
