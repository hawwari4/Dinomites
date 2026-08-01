from pydantic import BaseModel

from app.models.enums import Role


class LoginRequest(BaseModel):
    role: Role


class LoginResponse(BaseModel):
    token: str
    user: dict


class InternLoginRequest(BaseModel):
    email: str
    password: str


class RoleLoginRequest(BaseModel):
    role: Role
    username: str
    password: str
