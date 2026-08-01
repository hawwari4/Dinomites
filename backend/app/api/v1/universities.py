from fastapi import APIRouter, Depends

from app.core.dependencies import get_university_service
from app.services.university_service import UniversityService

router = APIRouter(prefix="/api/universities", tags=["universities"])


@router.get("")
def list_universities(service: UniversityService = Depends(get_university_service)):
    return service.list()


@router.get("/{university_id}")
def get_university(university_id: str, service: UniversityService = Depends(get_university_service)):
    return service.get(university_id)
