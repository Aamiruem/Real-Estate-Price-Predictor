# import os

# from dotenv import load_dotenv
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import declarative_base, sessionmaker

# # Load .env
# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")

# if not DATABASE_URL:
#     raise ValueError("DATABASE_URL is missing from .env")

# print("Database URL loaded successfully")

# # PostgreSQL engine
# engine = create_engine(
#     DATABASE_URL,
#     pool_pre_ping=True,
#     echo=False,
# )

# # Session
# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine,
# )

# # SQLAlchemy Base
# Base = declarative_base()


# # FastAPI database dependency
# def get_db():
#     db = SessionLocal()

#     try:
#         yield db
#     finally:
#         db.close()


# # Test database connection
# def test_connection():
#     try:
#         with engine.connect() as connection:
#             result = connection.execute(text("SELECT 1"))

#             print("✅ PostgreSQL Connected Successfully!")
#             print("Database test result:", result.scalar())

#             return True

#     except Exception as e:
#         print("❌ PostgreSQL Connection Failed!")
#         print("Error:", e)

#         return False


# if __name__ == "__main__":
#     test_connection()









import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is missing in .env"
    )


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE
# ============================================================

Base = declarative_base()


# ============================================================
# FASTAPI DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:
        db.close()


def ensure_auth_columns():
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS phone VARCHAR(20)"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS is_verified BOOLEAN "
                "NOT NULL DEFAULT TRUE"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS role VARCHAR(30) "
                "NOT NULL DEFAULT 'user'"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ "
                "NOT NULL DEFAULT now()"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "uq_users_phone_migration ON users (phone) "
                "WHERE phone IS NOT NULL"
            )
        )