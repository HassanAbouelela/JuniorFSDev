from typing import Annotated, Generator, TypeAlias

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.sql import expression
from sqlalchemy.types import DateTime

from app.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_engine(settings.DATABASE_URL, echo=False, future=True)
SessionFactory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _get_session() -> Generator[Session, None, None]:
    session = SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


DB_SESSION: TypeAlias = Annotated[Session, Depends(_get_session)]


# Add a custom function to generate UTC datetimes server-side
class UTCNow(expression.FunctionElement):
    type = DateTime()
    inherit_cache = True


@compiles(UTCNow, "postgresql")
def pg_utcnow(_element, _compiler, **_kw):
    return "TIMEZONE('utc', CURRENT_TIMESTAMP)"


__all__ = ["Base", "DB_SESSION", "UTCNow", "SessionFactory"]
