from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, Token, UserCreate


class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

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

    def login(self, data: LoginRequest) -> Token:
        user = self.repository.get_by_email(data.email)
        if not user or not user.is_active or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos",
            )
        token = create_access_token(user.id, user.role)
        return Token(access_token=token)
