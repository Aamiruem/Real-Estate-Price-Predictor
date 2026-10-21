# from datetime import datetime

# from sqlalchemy import (
#     Column,
#     DateTime,
#     Float,
#     ForeignKey,
#     Integer,
#     String,
#     Text,
# )
# from sqlalchemy.orm import relationship

# from database import Base


# # ============================================================
# # USER TABLE
# # ============================================================

# class User(Base):
#     """
#     Stores application users.
#     """

#     __tablename__ = "users"

#     id = Column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     name = Column(
#         String(150),
#         nullable=False,
#     )

#     email = Column(
#         String(255),
#         unique=True,
#         index=True,
#         nullable=False,
#     )

#     password_hash = Column(
#         String(255),
#         nullable=True,
#     )

#     created_at = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Relationship
#     # --------------------------------------------------------

#     properties = relationship(
#         "Property",
#         back_populates="user",
#         cascade="all, delete-orphan",
#     )


# # ============================================================
# # PROPERTY TABLE
# # ============================================================

# class Property(Base):
#     """
#     Stores property information submitted by users.
#     """

#     __tablename__ = "properties"

#     id = Column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     user_id = Column(
#         Integer,
#         ForeignKey("users.id"),
#         nullable=True,
#         index=True,
#     )

#     # --------------------------------------------------------
#     # Basic Property Information
#     # --------------------------------------------------------

#     location = Column(
#         String(150),
#         nullable=False,
#     )

#     locality = Column(
#         String(150),
#         nullable=False,
#     )

#     property_type = Column(
#         String(100),
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Property Dimensions
#     # --------------------------------------------------------

#     area = Column(
#         Float,
#         nullable=False,
#     )

#     bedrooms = Column(
#         Integer,
#         nullable=False,
#     )

#     bathrooms = Column(
#         Integer,
#         nullable=False,
#     )

#     floor = Column(
#         Integer,
#         nullable=False,
#     )

#     total_floors = Column(
#         Integer,
#         nullable=False,
#     )

#     property_age = Column(
#         Integer,
#         nullable=False,
#     )

#     parking = Column(
#         Integer,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Property Features
#     # --------------------------------------------------------

#     lift = Column(
#         String(20),
#         nullable=False,
#     )

#     furnishing = Column(
#         String(50),
#         nullable=False,
#     )

#     facing = Column(
#         String(50),
#         nullable=False,
#     )

#     balcony = Column(
#         Integer,
#         nullable=False,
#     )

#     amenities = Column(
#         Text,
#         nullable=True,
#     )

#     amenities_count = Column(
#         Integer,
#         nullable=False,
#         default=0,
#     )

#     # --------------------------------------------------------
#     # Community / Facilities
#     # --------------------------------------------------------

#     gated_community = Column(
#         String(20),
#         nullable=False,
#     )

#     security = Column(
#         String(20),
#         nullable=False,
#     )

#     power_backup = Column(
#         String(20),
#         nullable=False,
#     )

#     water_supply = Column(
#         String(50),
#         nullable=False,
#     )

#     property_status = Column(
#         String(50),
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Distance Features
#     # --------------------------------------------------------

#     metro_distance = Column(
#         Float,
#         nullable=False,
#     )

#     school_distance = Column(
#         Float,
#         nullable=False,
#     )

#     hospital_distance = Column(
#         Float,
#         nullable=False,
#     )

#     main_road_distance = Column(
#         Float,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Timestamp
#     # --------------------------------------------------------

#     created_at = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Relationships
#     # --------------------------------------------------------

#     user = relationship(
#         "User",
#         back_populates="properties",
#     )

#     predictions = relationship(
#         "Prediction",
#         back_populates="property",
#         cascade="all, delete-orphan",
#     )


# # ============================================================
# # PREDICTION TABLE
# # ============================================================

# class Prediction(Base):
#     """
#     Stores ML prediction results for a property.
#     """

#     __tablename__ = "predictions"

#     id = Column(
#         Integer,
#         primary_key=True,
#         index=True,
#     )

#     property_id = Column(
#         Integer,
#         ForeignKey("properties.id"),
#         nullable=False,
#         index=True,
#     )

#     # --------------------------------------------------------
#     # Prediction Values
#     # --------------------------------------------------------

#     predicted_price = Column(
#         Float,
#         nullable=False,
#     )

#     price_per_sqft = Column(
#         Float,
#         nullable=False,
#     )

#     min_price = Column(
#         Float,
#         nullable=False,
#     )

#     max_price = Column(
#         Float,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Model Information
#     # --------------------------------------------------------

#     model_version = Column(
#         String(100),
#         nullable=False,
#         default="random-forest-v1",
#     )

#     created_at = Column(
#         DateTime,
#         default=datetime.utcnow,
#         nullable=False,
#     )

#     # --------------------------------------------------------
#     # Relationship
#     # --------------------------------------------------------

#     property = relationship(
#         "Property",
#         back_populates="predictions",
#     )





from datetime import datetime, timedelta, timezone
import os
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv(Path(__file__).resolve().with_name(".env"))


SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY"
)

REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)
REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
)

if not SECRET_KEY or not REFRESH_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY and JWT_REFRESH_SECRET_KEY must be set in "
        f"{Path(__file__).resolve().with_name('.env')}"
    )


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(schemes=["argon2"])


# ============================================================
# PASSWORD FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    password_hash: str
) -> bool:
    if is_legacy_bcrypt_hash(password_hash):
        encoded_password = plain_password.encode("utf-8")
        if len(encoded_password) > 72:
            return False
        return bcrypt.checkpw(
            encoded_password,
            password_hash.encode("ascii"),
        )

    return pwd_context.verify(
        plain_password,
        password_hash
    )


def is_legacy_bcrypt_hash(password_hash: str) -> bool:
    return password_hash.startswith(("$2a$", "$2b$", "$2y$"))


# ============================================================
# JWT ACCESS TOKEN
# ============================================================

def _create_token(
    user_id: int,
    secret_key: str,
    expires_delta: timedelta,
    token_type: str,
) -> str:

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=ALGORITHM
    )


def create_access_token(user_id: int) -> str:
    return _create_token(
        user_id,
        SECRET_KEY,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        user_id,
        REFRESH_SECRET_KEY,
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "refresh",
    )


def decode_token(token: str, token_type: str) -> int:
    secret_key = SECRET_KEY if token_type == "access" else REFRESH_SECRET_KEY
    payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])

    if payload.get("type") != token_type:
        raise JWTError("Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise JWTError("Token subject missing")

    return int(subject)