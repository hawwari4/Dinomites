from fastapi import APIRouter, Depends

from app.core.dependencies import get_auth_service
from app.models.auth import InternLoginRequest, LoginRequest, LoginResponse, RoleLoginRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login(body.role)


@router.post("/login/intern", response_model=LoginResponse)
def login_intern(body: InternLoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login_intern(body.email, body.password)


@router.post("/login/role", response_model=LoginResponse)
def login_role(body: RoleLoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login_with_credentials(body.role, body.username, body.password)
