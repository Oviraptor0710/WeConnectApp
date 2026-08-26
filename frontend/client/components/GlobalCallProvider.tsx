import { useEffect, useRef, useState, type ReactNode } from "react";
import { io, Socket } from 'socket.io-client';
import IncomingCallModal from "@/components/IncomingCallModal";
import { type IncomingCallPayload } from "@/lib/videoApi";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_BASE_URL;

/**
 * GlobalCallProvider — mounts once at app root level.
 * Keeps a persistent Socket connection on the user's private channel
 * so incoming call notifications are received from any page.
 * Re-connects whenever the logged-in user changes.
 */
export default function GlobalCallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Not logged in — ensure any stale connection is cleaned up
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on("video:incoming-call", (payload: IncomingCallPayload) => {
      setIncomingCall(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
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
