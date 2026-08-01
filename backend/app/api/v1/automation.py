from fastapi import APIRouter, Depends

from app.core.dependencies import get_automation_service
from app.models.automation import AutomationRequest, AutomationResponse
from app.services.automation_service import AutomationService

router = APIRouter(prefix="/api/automation", tags=["automation"])


@router.post("", response_model=AutomationResponse)
def run_automation(body: AutomationRequest, service: AutomationService = Depends(get_automation_service)):
    affected = service.run(body.kind, body.candidateIds, body.subject, body.body, body.signatureData)
    return {"affected": affected}


@router.get("/payroll-preview")
def payroll_preview(service: AutomationService = Depends(get_automation_service)):
    return service.payroll_preview()
