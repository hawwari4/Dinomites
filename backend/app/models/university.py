from pydantic import BaseModel


class University(BaseModel):
    id: str
    name: str
    focus: str
    pushed: int = 0
