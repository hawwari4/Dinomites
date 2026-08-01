from app.repositories.base_repository import BaseRepository


class ContractRepository(BaseRepository[dict]):
    filename = "contracts.json"
    id_prefix = "K"
