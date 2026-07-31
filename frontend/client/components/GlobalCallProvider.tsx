import { useEffect, useRef, useState, type ReactNode } from "react";
import Pusher from "pusher-js";
import IncomingCallModal from "@/components/IncomingCallModal";
import { getAccessToken } from "@/lib/auth";
import { getPusherConfig } from "@/lib/chatApi";
import { API_BASE_URL } from "@/lib/api";
import { type IncomingCallPayload } from "@/lib/videoApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * GlobalCallProvider — mounts once at app root level.
 * Keeps a persistent Pusher subscription on the user's private channel
 * so incoming call notifications are received from any page.
 * Re-connects whenever the logged-in user changes.
 */
export default function GlobalCallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    // Not logged in — ensure any stale connection is cleaned up
    if (!user) {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let channelName = "";
    const token = getAccessToken();
    if (!token) return;

    async function connect() {
      if (!token || !user) return;
      try {
        const response = await getPusherConfig();
        if (cancelled) return;

        const pusher = new Pusher(response.data.key, {
          cluster: response.data.cluster,
          authEndpoint: `${API_BASE_URL}${response.data.auth_endpoint}`,
          auth: {
            headers: { Authorization: `Bearer ${token}` },
          },
        });

        channelName = `private-user-${user.user_id}`;
        const channel = pusher.subscribe(channelName);

        channel.bind("video:incoming-call", (payload: IncomingCallPayload) => {
          setIncomingCall(payload);
        });

        pusherRef.current = pusher;
      } catch (err) {
        console.warn("[GlobalCallProvider] Pusher unavailable:", err);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (pusherRef.current) {
        if (channelName) pusherRef.current.unsubscribe(channelName);
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [user?.user_id]); // re-run when user logs in/out

  const handleDismissCall = () => setIncomingCall(null);

  return (
    <>
      {children}
      {incomingCall && (
        <IncomingCallModal
          payload={incomingCall}
          onClose={handleDismissCall}
        />
      )}
    </>
  );
}
