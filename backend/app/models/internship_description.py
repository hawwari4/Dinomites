from pydantic import BaseModel


class InternshipDescription(BaseModel):
    id: str
    startupId: str
    fileName: str
    fileUrl: str
    extractedSkills: list[str] = []
    summary: str | None = None
    position: str | None = None
    commitment: str | None = None
    weeklyHours: int | None = None
    weeks: int | None = None
    cycle: str | None = None
    uploadedAt: str
