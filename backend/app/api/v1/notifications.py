from fastapi import APIRouter, Depends

from app.core.dependencies import get_notification_service
from app.models.notification import NotificationCreate
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(candidateId: str, service: NotificationService = Depends(get_notification_service)):
    return service.list_for_candidate(candidateId)


@router.post("")
def create_notification(body: NotificationCreate, service: NotificationService = Depends(get_notification_service)):
    return service.create(body.candidateId, body.startupId, body.message)


@router.put("/{notification_id}/read")
def mark_read(notification_id: str, service: NotificationService = Depends(get_notification_service)):
    return service.mark_read(notification_id)
