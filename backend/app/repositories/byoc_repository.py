from app.repositories.base_repository import BaseRepository


class ByocRepository(BaseRepository[dict]):
    filename = "byoc.json"
    id_prefix = "byoc"
