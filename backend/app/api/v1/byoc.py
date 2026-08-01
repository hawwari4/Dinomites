from fastapi import APIRouter, Depends

from app.core.dependencies import get_byoc_service
from app.models.byoc import ByocCreate
from app.services.byoc_service import ByocService

router = APIRouter(prefix="/api/byoc", tags=["byoc"])


@router.get("")
def list_byoc(startupId: str | None = None, service: ByocService = Depends(get_byoc_service)):
    return service.list(startup_id=startupId)


@router.post("")
def submit_byoc(body: ByocCreate, service: ByocService = Depends(get_byoc_service)):
    return service.submit(body.model_dump())


@router.put("/{byoc_id}/approve")
def approve_byoc(byoc_id: str, service: ByocService = Depends(get_byoc_service)):
    return service.approve(byoc_id)


@router.put("/{byoc_id}/reject")
def reject_byoc(byoc_id: str, service: ByocService = Depends(get_byoc_service)):
    return service.reject(byoc_id)
