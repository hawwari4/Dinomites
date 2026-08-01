from app.repositories.base_repository import BaseRepository


class InternshipDescriptionRepository(BaseRepository[dict]):
    filename = "internship_descriptions.json"
    id_prefix = "jd"
