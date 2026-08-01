from fastapi import HTTPException

from app.repositories.university_repository import UniversityRepository


class UniversityService:
    def __init__(self, universities: UniversityRepository):
        self._universities = universities

    def list(self) -> list[dict]:
        return self._universities.list()

    def get(self, university_id: str) -> dict:
        uni = self._universities.get(university_id)
        if not uni:
            raise HTTPException(status_code=404, detail="University not found")
        return uni
