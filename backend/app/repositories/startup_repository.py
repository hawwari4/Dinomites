from app.repositories.base_repository import BaseRepository


class StartupRepository(BaseRepository[dict]):
    filename = "startups.json"
    id_prefix = "st"
