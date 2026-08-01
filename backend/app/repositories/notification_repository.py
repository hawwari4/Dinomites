from app.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[dict]):
    filename = "notifications.json"
    id_prefix = "ntf"
