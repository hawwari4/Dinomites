from pydantic import BaseModel


class Startup(BaseModel):
    id: str
    name: str
    sector: str
    location: str
    qstpCohortsUsed: int = 0
    premium: bool = False
    needs: list[str] = []


class StartupUpdate(BaseModel):
    needs: list[str] | None = None
    qstpCohortsUsed: int | None = None
    premium: bool | None = None


class NeedRequest(BaseModel):
    need: str
