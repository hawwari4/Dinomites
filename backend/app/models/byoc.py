from pydantic import BaseModel

from app.models.enums import ByocStatus, Commitment, Track


class Byoc(BaseModel):
    id: str
    startupId: str
    startupName: str
    fullName: str
    email: str
    cvLink: str
    track: Track
    commitment: Commitment
    status: ByocStatus = ByocStatus.PENDING
    submittedAt: str


class ByocCreate(BaseModel):
    startupId: str
    startupName: str
    fullName: str
    email: str
    cvLink: str
    track: Track
    commitment: Commitment
