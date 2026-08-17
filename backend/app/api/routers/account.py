from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.card_repository import CardRepository
from app.repositories.user_repository import UserRepository
from app.schemas.account import AddCardRequest, CardRead, ChangePasswordRequest, UpdateProfileRequest
from app.schemas.auth import UserRead
from app.services.account_service import AccountService

router = APIRouter(prefix="/me", tags=["account"])


def get_account_service(session: Session = Depends(get_session)) -> AccountService:
    return AccountService(UserRepository(session), CardRepository(session))


@router.put("", response_model=UserRead)
def update_profile(
    data: UpdateProfileRequest,
    service: AccountService = Depends(get_account_service),
    user: User = Depends(get_current_user),
):
    return service.update_profile(user, data)


@router.post("/password", status_code=204)
def change_password(
    data: ChangePasswordRequest,
    service: AccountService = Depends(get_account_service),
    user: User = Depends(get_current_user),
):
    service.change_password(user, data)


@router.get("/cards", response_model=list[CardRead])
def list_cards(
    service: AccountService = Depends(get_account_service),
    user: User = Depends(get_current_user),
):
    return service.list_cards(user)


@router.post("/cards", response_model=CardRead, status_code=201)
def add_card(
    data: AddCardRequest,
    service: AccountService = Depends(get_account_service),
    user: User = Depends(get_current_user),
):
    return service.add_card(user, data)


@router.delete("/cards/{card_id}", status_code=204)
def remove_card(
    card_id: int,
    service: AccountService = Depends(get_account_service),
    user: User = Depends(get_current_user),
):
    service.remove_card(user, card_id)


@router.delete("", status_code=204)
def delete_account(
    service: AccountService = Depends(get_account_service),
    user: User = Depends(get_current_user),
):
    service.delete_account(user)
