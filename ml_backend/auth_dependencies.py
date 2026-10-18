import os

from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import Response
from jose import JWTError
from sqlalchemy.orm import Session

from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    decode_token,
)
from database.database import get_db
from database.models import User


ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        user_id = decode_token(token, "access")
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active",
        )

    return user


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    same_site = os.getenv("COOKIE_SAMESITE", "lax")

    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=same_site,
        max_age=60 * ACCESS_TOKEN_EXPIRE_MINUTES,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=same_site,
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAYS,
        # "/" so the cookie also reaches /api/auth/refresh via the Vite proxy.
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key=ACCESS_COOKIE, path="/")
    response.delete_cookie(key=REFRESH_COOKIE, path="/")
    # Clear refresh cookies issued before the path change.
    response.delete_cookie(key=REFRESH_COOKIE, path="/auth/refresh")
