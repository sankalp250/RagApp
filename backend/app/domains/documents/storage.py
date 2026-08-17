import os
import shutil
from typing import Protocol, BinaryIO, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger


class StorageBackend(Protocol):
    async def save_file(self, file_content: bytes, destination_filename: str) -> str:
        """Saves file and returns storage path."""
        ...

    async def read_file(self, storage_path: str) -> bytes:
        """Reads file bytes from storage."""
        ...

    async def delete_file(self, storage_path: str) -> bool:
        """Deletes file from storage."""
        ...


class LocalStorageBackend:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = os.path.abspath(base_dir or settings.LOCAL_STORAGE_DIR)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file_content: bytes, destination_filename: str) -> str:
        file_path = os.path.join(self.base_dir, destination_filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)
        logger.info(f"Saved file to local storage: {file_path}")
        return file_path

    async def read_file(self, storage_path: str) -> bytes:
        if not os.path.exists(storage_path):
            raise FileNotFoundError(f"Storage file not found: {storage_path}")
        with open(storage_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_path: str) -> bool:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            logger.info(f"Deleted file from local storage: {storage_path}")
            return True
        return False


def get_storage_backend() -> StorageBackend:
    """Factory returning configured storage backend."""
    return LocalStorageBackend()
