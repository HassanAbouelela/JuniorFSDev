from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy import select

from app import models
from app.auth import REQUIRE_USER, generate_token, read_token_subject
from app.config import get_settings
from app.db import DB_SESSION
from app.schemas.users import RefreshRequest, TokenPair, UserCreate, UserRead

router = APIRouter(tags=["users"])
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/token")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB_SESSION) -> TokenPair:
    user_query = select(models.User).where(models.User.email == form_data.username).limit(1)
    user: models.User | None = db.execute(user_query).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    if not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    return TokenPair(
        access_token=generate_token(settings.JWT_DURATION, user.email, "access"),
        refresh_token=generate_token(settings.JWT_REFRESH_DURATION, user.email, "refresh"),
    )


@router.post("/token/refresh")
def refresh_access_token(refresh: RefreshRequest, db: DB_SESSION) -> TokenPair:
    subject = read_token_subject(refresh.refresh_token, "refresh")
    user_query = select(models.User).where(models.User.email == subject).limit(1)
    user: models.User | None = db.execute(user_query).scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return TokenPair(
        access_token=generate_token(settings.JWT_DURATION, user.email, "access"),
        refresh_token=generate_token(settings.JWT_REFRESH_DURATION, user.email, "refresh"),
    )


@router.get("/me", response_model=UserRead)
async def get_current_user(user: REQUIRE_USER) -> UserRead:
    return UserRead.from_db(user)


@router.post("/", response_model=UserRead, status_code=201)
def create_user(new_user: UserCreate, db: DB_SESSION) -> UserRead:
    # Check if the user already exists
    existing_query = select(models.User).where(models.User.email == new_user.email).limit(1)
    existing: models.User | None = db.execute(existing_query).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create a new user (passlib automatically handles salting)
    password_hash = pwd_context.hash(new_user.password)
    user = models.User(name=new_user.name, email=new_user.email, password_hash=password_hash)
    db.add(user)
    db.flush()
    db.refresh(user)

    return UserRead.from_db(user)
