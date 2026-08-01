from app.repositories.base_repository import BaseRepository


class CandidateRepository(BaseRepository[dict]):
    filename = "candidates.json"
    id_prefix = "c"
