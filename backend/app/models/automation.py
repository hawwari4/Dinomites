from pydantic import BaseModel

from app.models.enums import AutomationKind


class AutomationRequest(BaseModel):
    kind: AutomationKind
    candidateIds: list[str]
    subject: str | None = None
    body: str | None = None
    signatureData: str | None = None


class AutomationResponse(BaseModel):
    affected: int
