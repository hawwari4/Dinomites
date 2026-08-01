from fastapi import APIRouter, Depends, File, UploadFile

from app.core.dependencies import get_internship_description_service, get_startup_service
from app.models.startup import NeedRequest, StartupUpdate
from app.services.internship_description_service import InternshipDescriptionService
from app.services.startup_service import StartupService

router = APIRouter(prefix="/api/startups", tags=["startups"])


@router.get("")
def list_startups(service: StartupService = Depends(get_startup_service)):
    return service.list()


@router.get("/{startup_id}")
def get_startup(startup_id: str, service: StartupService = Depends(get_startup_service)):
    return service.get(startup_id)


@router.put("/{startup_id}")
def update_startup(startup_id: str, body: StartupUpdate, service: StartupService = Depends(get_startup_service)):
    return service.update(startup_id, body.model_dump(exclude_unset=True))


@router.post("/{startup_id}/needs")
def add_need(startup_id: str, body: NeedRequest, service: StartupService = Depends(get_startup_service)):
    return service.add_need(startup_id, body.need)


@router.delete("/{startup_id}/needs/{need}")
def remove_need(startup_id: str, need: str, service: StartupService = Depends(get_startup_service)):
    return service.remove_need(startup_id, need)


@router.get("/{startup_id}/candidates")
def startup_candidates(startup_id: str, service: StartupService = Depends(get_startup_service)):
    return service.candidate_scores(startup_id)


@router.get("/{startup_id}/matches")
def startup_intern_matches(startup_id: str, service: StartupService = Depends(get_startup_service)):
    return service.intern_matches(startup_id)


@router.get("/{startup_id}/descriptions")
def list_descriptions(
    startup_id: str, service: InternshipDescriptionService = Depends(get_internship_description_service)
):
    return service.list(startup_id)


@router.post("/{startup_id}/descriptions")
async def upload_description(
    startup_id: str,
    file: UploadFile = File(...),
    service: InternshipDescriptionService = Depends(get_internship_description_service),
):
    return service.upload(startup_id, file.filename, await file.read())
