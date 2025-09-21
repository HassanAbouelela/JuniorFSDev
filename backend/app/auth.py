import datetime
import logging
from typing import Annotated, Literal, TypeAlias

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select

from app import models
from app.config import get_settings
from app.db import DB_SESSION
from app.models import User

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/token")
TOKEN_TYPES = Literal["access", "refresh"]
settings = get_settings()


def auth_error(detail: str = "Invalid authentication credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def read_token_subject(token: str, expected_type: TOKEN_TYPES) -> str:
    try:
        data = jwt.decode(
            token,
            settings.JWT_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "nbf", "sub", "typ"]},
        )
        subject = data["sub"]
        typ = data["typ"]
    except jwt.ExpiredSignatureError:
        raise auth_error("Expired token")
    except jwt.ImmatureSignatureError:
        raise auth_error("Token not valid yet")
    except (
        jwt.DecodeError,
        jwt.InvalidSignatureError,
        jwt.InvalidKeyError,
        jwt.InvalidAlgorithmError,
        jwt.MissingRequiredClaimError,
    ) as e:
        # Token failed validation, has an invalid signature, is improperly formatted,
        # is signed with an incompatible algorithm, or is missing required data
        # Generally, these errors are not recoverable, and should fail with no further information
        logger.debug("Disallowing authorization due to invalid token", exc_info=e)
        raise auth_error()
    except Exception as e:
        logger.exception("Unhandled error while decoding JWT", exc_info=e)
        raise auth_error()

    if not isinstance(subject, str):
        logger.error(f"Attempting to authenticate with non-string subject: ({type(subject)}) '{subject}'")
        raise auth_error()

    if typ != expected_type:
        # Attempting to use a refresh token as access token, or vice-versa
        raise auth_error("Invalid token type")

    return subject


async def _require_user(token: Annotated[str, Depends(oauth2_scheme)], db: DB_SESSION) -> User:
    # Note: this uses non-stateless tokens, however if it is needed for performance reasons, we can encode
    # the desired user attributes directly into the token.
    subject = read_token_subject(token, "access")
    user_query = select(models.User).where(models.User.email == subject).limit(1)
    user: models.User | None = db.execute(user_query).scalar_one_or_none()
    if not user:
        logger.warning(f"Detected valid auth token with no associated user: {subject}")
        raise auth_error()

    return user


async def _require_admin_user(user: Annotated[models.User, Depends(_require_user)]) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return user


def generate_token(duration: datetime.timedelta, user_email: str, token_type: TOKEN_TYPES) -> str:
    nbf = datetime.datetime.now(tz=datetime.timezone.utc)
    exp = nbf + duration
    data = {
        "sub": user_email,
        "nbf": nbf,
        "iat": nbf,
        "exp": exp,
        "typ": token_type,
    }
    return jwt.encode(data, settings.JWT_KEY, settings.JWT_ALGORITHM)


REQUIRE_USER: TypeAlias = Annotated[models.User, Depends(_require_user)]
REQUIRE_ADMIN_USER: TypeAlias = Annotated[models.User, Depends(_require_admin_user)]
REQUIRE_ADMIN_PATH = Depends(_require_admin_user)

__all__ = ["REQUIRE_USER", "REQUIRE_ADMIN_USER", "REQUIRE_ADMIN_PATH", "generate_token", "read_token_subject"]
