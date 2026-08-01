from fastapi import APIRouter, Depends

from app.core.dependencies import get_dashboard_service
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/dashboard")
def dashboard(service: DashboardService = Depends(get_dashboard_service)):
    return service.summary()
