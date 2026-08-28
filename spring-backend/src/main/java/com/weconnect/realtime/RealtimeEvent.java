package com.weconnect.realtime;

public record RealtimeEvent(String room, String event, Object data) {
}
