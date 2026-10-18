# from pydantic import BaseModel, EmailStr, Field


# class SignupRequest(BaseModel):
#     full_name: str = Field(min_length=2, max_length=150)
#     email: EmailStr
#     phone: str | None = None
#     password: str = Field(min_length=8)
#     confirm_password: str


# class LoginRequest(BaseModel):
#     email: EmailStr
#     password: str


# class VerifyRequest(BaseModel):
#     token: str


# class UserResponse(BaseModel):
#     id: int
#     full_name: str
#     email: EmailStr
#     phone: str | None
#     is_verified: bool

#     class Config:
#         from_attributes = True






from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)


# ============================================================
# SIGNUP
# ============================================================

class SignupRequest(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    phone: str = Field(
        min_length=10,
        max_length=15
    )

    password: str = Field(
        min_length=8,
        max_length=100
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=100
    )


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# ============================================================
# CONTACT ENQUIRY
# ============================================================

class ContactRequest(BaseModel):

    name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    phone: str | None = Field(default=None, max_length=20)

    enquiry_type: Literal[
        "Property valuation",
        "Technical support",
        "General enquiry",
    ]

    message: str = Field(min_length=10, max_length=1000)
