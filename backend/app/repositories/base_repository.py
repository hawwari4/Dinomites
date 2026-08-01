from __future__ import annotations

import threading
from pathlib import Path
from typing import Generic, TypeVar
from uuid import uuid4

from app.core import config
from app.utils.file_utils import read_json, write_json

T = TypeVar("T", bound=dict)

# One lock per data file, shared across all repository instances (repos are constructed
# fresh per request, so an instance-level lock wouldn't serialize concurrent requests).
_file_locks: dict[str, threading.Lock] = {}
_file_locks_guard = threading.Lock()


def _lock_for(path: Path) -> threading.Lock:
    key = str(path)
    with _file_locks_guard:
        lock = _file_locks.get(key)
        if lock is None:
            lock = threading.Lock()
            _file_locks[key] = lock
        return lock


class BaseRepository(Generic[T]):
    """Generic JSON-file backed CRUD repository. Subclasses set `filename` and `id_prefix`."""

    filename: str = ""
    id_prefix: str = "id"

    def __init__(self, data_dir: Path | None = None):
        # Resolved against config.DATA_DIR at construction time (not import time) so tests
        # can monkeypatch config.DATA_DIR and get isolated data per test.
        self._path = (data_dir or config.DATA_DIR) / self.filename

    def list(self) -> list[T]:
        return read_json(self._path, [])

    def get(self, item_id: str) -> T | None:
        return next((item for item in self.list() if item.get("id") == item_id), None)

    def create(self, item: T) -> T:
        if "id" not in item or not item["id"]:
            item["id"] = f"{self.id_prefix}-{uuid4().hex[:8]}"
        with _lock_for(self._path):
            items = self.list()
            items.append(item)
            write_json(self._path, items)
        return item

    def update(self, item_id: str, patch: dict) -> T | None:
        with _lock_for(self._path):
            items = self.list()
            idx = next((i for i, x in enumerate(items) if x.get("id") == item_id), -1)
            if idx < 0:
                return None
            items[idx] = {**items[idx], **patch}
            write_json(self._path, items)
            return items[idx]

    def delete(self, item_id: str) -> bool:
        with _lock_for(self._path):
            items = self.list()
            remaining = [x for x in items if x.get("id") != item_id]
            if len(remaining) == len(items):
                return False
            write_json(self._path, remaining)
            return True

    def replace_all(self, items: list[T]) -> list[T]:
        with _lock_for(self._path):
            write_json(self._path, items)
        return items
