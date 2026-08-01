from pydantic import BaseModel


class Notification(BaseModel):
    id: str
    candidateId: str
    startupId: str | None = None
    startupName: str
    message: str
    read: bool = False
    createdAt: str


class NotificationCreate(BaseModel):
    candidateId: str
    startupId: str
    message: str
