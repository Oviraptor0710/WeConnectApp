import logging
from functools import lru_cache
from typing import Any

from app.config import settings

try:
    import pusher as pusher_sdk
except ImportError:  # pragma: no cover - optional until requirements are installed
    pusher_sdk = None


logger = logging.getLogger(__name__)


def _has_credentials() -> bool:
    return all(
        [
            settings.PUSHER_APP_ID,
            settings.PUSHER_KEY,
            settings.PUSHER_SECRET,
            settings.PUSHER_CLUSTER,
        ]
    )


@lru_cache
def get_pusher_client():
    if pusher_sdk is None or not _has_credentials():
        return None
    return pusher_sdk.Pusher(
        app_id=settings.PUSHER_APP_ID,
        key=settings.PUSHER_KEY,
        secret=settings.PUSHER_SECRET,
        cluster=settings.PUSHER_CLUSTER,
        ssl=settings.PUSHER_SSL,
    )


def is_pusher_enabled() -> bool:
    return get_pusher_client() is not None


def trigger_event(channel: str, event: str, data: dict[str, Any]) -> bool:
    client = get_pusher_client()
    if client is None:
        return False
    try:
        client.trigger(channel, event, data)
        return True
    except Exception:
        logger.exception("Failed to trigger Pusher event %s on %s", event, channel)
        return False


def authenticate_channel(channel: str, socket_id: str) -> dict[str, Any] | None:
    client = get_pusher_client()
    if client is None:
        return None
    return client.authenticate(channel=channel, socket_id=socket_id)
