package com.weconnect.realtime;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class RealtimeEventListener {
    private final WsBroadcastClient wsBroadcastClient;

    public RealtimeEventListener(WsBroadcastClient wsBroadcastClient) {
        this.wsBroadcastClient = wsBroadcastClient;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterCommit(RealtimeEvent event) {
        wsBroadcastClient.broadcast(event.room(), event.event(), event.data());
    }
}
