from app.repositories.base_repository import BaseRepository


class UniversityRepository(BaseRepository[dict]):
    filename = "universities.json"
    id_prefix = "uni"
