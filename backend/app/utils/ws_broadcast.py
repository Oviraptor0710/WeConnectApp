import logging
import httpx
from typing import Any
from app.config import settings

logger = logging.getLogger(__name__)

def trigger_event(channel: str, event: str, data: dict[str, Any]) -> bool:
    """
    Triggers an event by calling the internal Node.js WebSocket server.
    This acts as a drop-in replacement for the old pusher.trigger.
    """
    url = f"{settings.WS_SERVER_INTERNAL_URL}/internal/broadcast"
    payload = {
        "room": channel,
        "event": event,
        "data": data
    }
    try:
        response = httpx.post(
            url,
            json=payload,
            headers={
                "X-Internal-Secret": settings.WS_INTERNAL_SECRET or settings.SECRET_KEY
            },
            timeout=2.0,
        )
        response.raise_for_status()
        return True
    except Exception as e:
        logger.exception("Failed to trigger WS event %s on %s", event, channel)
        return False
