from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.repositories.credential_repository import CredentialRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    CredentialRegisterRequest,
    LoginRequest,
    Token,
    UserCreate,
    UserRead,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(UserRepository(session), CredentialRepository(session))


@router.post("/register", response_model=UserRead, status_code=201)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@router.post("/register/organizador", response_model=UserRead, status_code=201)
def register_organizador(
    data: CredentialRegisterRequest, service: AuthService = Depends(get_auth_service)
):
    return service.register_with_credential(data, UserRole.organizer)


@router.post("/register/portaria", response_model=UserRead, status_code=201)
def register_portaria(
    data: CredentialRegisterRequest, service: AuthService = Depends(get_auth_service)
):
    return service.register_with_credential(data, UserRole.gate)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login(data)


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user
