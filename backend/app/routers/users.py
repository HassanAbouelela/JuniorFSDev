from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.auth import (
    REQUIRE_ADMIN_PATH,
    REQUIRE_USER,
    generate_token,
    read_token_subject,
)
from app.config import get_settings
from app.db import DB_SESSION
from app.schemas.users import (
    RefreshRequest,
    TokenPair,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter(tags=["users"])
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user_by_email(db: Session, email: str) -> models.User | None:
    user_query = select(models.User).where(models.User.email == email).limit(1)
    return db.execute(user_query).scalar_one_or_none()


@router.post("/token")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB_SESSION) -> TokenPair:
    user = get_user_by_email(db, form_data.username)
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
    user = get_user_by_email(db, subject)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return TokenPair(
        access_token=generate_token(settings.JWT_DURATION, user.email, "access"),
        refresh_token=generate_token(settings.JWT_REFRESH_DURATION, user.email, "refresh"),
    )


@router.get("/me", response_model=UserRead)
async def get_current_user(user: REQUIRE_USER) -> UserRead:
    return UserRead.from_db(user)


@router.get("/{email}", response_model=UserRead, dependencies=[REQUIRE_ADMIN_PATH])
def get_user(email: str, db: DB_SESSION) -> UserRead:
    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=404)
    return UserRead.from_db(user)


@router.put("/{email}", response_model=UserRead, dependencies=[REQUIRE_ADMIN_PATH])
def update_user(email: str, data: UserUpdate, db: DB_SESSION) -> UserRead:
    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=404)

    user.email = data.email if data.email is not None else user.email
    user.name = data.name if data.name is not None else user.name
    user.password_hash = pwd_context.hash(data.password) if data.password is not None else user.password_hash
    user.is_admin = data.is_admin if data.is_admin is not None else user.is_admin

    db.flush()
    db.refresh(user)
    return UserRead.from_db(user)


@router.delete("/{email}", dependencies=[REQUIRE_ADMIN_PATH], status_code=204)
def delete_user(email: str, db: DB_SESSION) -> None:
    user = get_user_by_email(db, email)
    if user is None:
        return
    db.delete(user)


@router.post("/", response_model=UserRead, status_code=201)
def create_user(new_user: UserCreate, db: DB_SESSION) -> UserRead:
    # Check if the user already exists
    existing = get_user_by_email(db, new_user.email)
    if existing is not None:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create a new user (passlib automatically handles salting)
    password_hash = pwd_context.hash(new_user.password)
    is_admin = settings.APP_ENV == "DEVELOPMENT" and new_user.name == "Admin"
    user = models.User(name=new_user.name, email=new_user.email, password_hash=password_hash, is_admin=is_admin)
    db.add(user)
    db.flush()
    db.refresh(user)

    return UserRead.from_db(user)
