import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rejectCall, type IncomingCallPayload } from "@/lib/videoApi";

interface Props {
  payload: IncomingCallPayload;
  onClose: (reason?: "REJECTED" | "TIMEOUT") => void;
}

const RING_TIMEOUT_MS = 15_000; // auto-reject after 15 s

export default function IncomingCallModal({ payload, onClose }: Props) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(15);
  const timerRef = useRef<number | null>(null);
  // Guard: set to true the moment user accepts — prevents handleTimeout from
  // firing a spurious rejection signal during the unmount race condition.
  const acceptedRef = useRef(false);

  const handleTimeout = () => {
    // Do NOT send rejection if user has already accepted
    if (acceptedRef.current) return;
    rejectCall(payload.caller_id, "TIMEOUT").catch(() => { });
    onClose("TIMEOUT");
  };

  const handleAccept = () => {
    // Mark as accepted FIRST and clear the interval immediately
    // to prevent handleTimeout from firing before the component unmounts
    acceptedRef.current = true;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onClose();
    const params = new URLSearchParams({
      room: payload.room_name,
      partner: payload.caller_name,
      ...(payload.caller_avatar ? { avatar: payload.caller_avatar } : {}),
    });
    navigate(`/call?${params.toString()}`);
  };

  const handleReject = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    rejectCall(payload.caller_id, "REJECTED").catch(() => { });
    onClose("REJECTED");
  };

  // Countdown + auto-close
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Use setTimeout to avoid calling side-effects inside a state updater
          setTimeout(handleTimeout, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
    >
      {/* Card */}
      <div
        className="relative flex flex-col items-center gap-6 rounded-3xl px-10 py-10 shadow-2xl"
        style={{
          background: "rgba(20,28,20,0.92)",
          border: "1px solid rgba(78,222,163,0.18)",
          minWidth: 300,
          maxWidth: 360,
        }}
      >
        {/* Pulsing ring */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute rounded-full animate-ping"
            style={{
              width: 112,
              height: 112,
              background: "rgba(78,222,163,0.15)",
              animationDuration: "1.4s",
            }}
          />
          {/* Avatar */}
          {payload.caller_avatar ? (
            <img
              src={payload.caller_avatar}
              alt={payload.caller_name}
              className="w-24 h-24 rounded-full object-cover relative z-10"
              style={{ border: "3px solid rgba(78,222,163,0.50)" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center relative z-10"
              style={{
                background: "rgba(74,103,65,0.70)",
                border: "3px solid rgba(78,222,163,0.50)",
              }}
            >
              <span className="text-white font-bold text-4xl">
                {payload.caller_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-white/60 text-sm font-medium">Cuộc gọi video đến</p>
          <h2
            className="text-white font-bold"
            style={{ fontFamily: "Inter, sans-serif", fontSize: 22 }}
          >
            {payload.caller_name}
          </h2>
          <p className="text-white/40 text-xs">Tự động từ chối sau {secondsLeft}s</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-8">
          {/* Reject */}
          <button
            id="btn-reject-call"
            onClick={handleReject}
            className="flex flex-col items-center gap-2 transition-transform hover:scale-110 active:scale-95"
            title="Từ chối"
          >
            <div
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 0 0 8px rgba(239,68,68,0.18)" }}
            >
              {/* Phone down / reject icon */}
              <svg width="28" height="28" viewBox="0 0 39 39" fill="none">
                <path
                  d="M1.11369 17.9782C3.3234 15.7685 5.98831 14.067 9.10842 12.8738C12.2285 11.6805 15.5564 11.0839 19.0919 11.0839C22.6274 11.0839 25.9552 11.6805 29.0754 12.8738C32.1955 14.067 34.8604 15.7685 37.0701 17.9782C37.3883 18.2964 37.5474 18.6676 37.5474 19.0919C37.5474 19.5162 37.3883 19.8874 37.0701 20.2056L32.7744 24.5013C32.5269 24.7487 32.222 24.8857 31.8596 24.9123C31.4972 24.9388 31.1834 24.8548 30.9183 24.6604L26.5165 21.6375C26.1983 21.39 25.9685 21.1425 25.8271 20.895C25.6857 20.6475 25.615 20.3824 25.615 20.0995L25.5884 14.9288C24.5808 14.6283 23.529 14.4161 22.433 14.2924C21.337 14.1687 20.2144 14.1156 19.0654 14.1333C17.9694 14.1333 16.8866 14.1996 15.8171 14.3322C14.7476 14.4648 13.6825 14.6725 12.6219 14.9553V19.9404C12.6219 20.2586 12.5335 20.5857 12.3567 20.9215C12.1799 21.2574 11.9501 21.5314 11.6673 21.7435L7.26553 24.6604C6.94733 24.8371 6.61587 24.9123 6.27116 24.8857C5.92644 24.8592 5.63918 24.7311 5.40937 24.5013L1.11369 20.2056C0.795495 19.8874 0.636397 19.5162 0.636397 19.0919C0.636397 18.6676 0.795495 18.2964 1.11369 17.9782Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="text-white/70 text-xs font-semibold">Từ chối</span>
          </button>

          {/* Accept */}
          <button
            id="btn-accept-call"
            onClick={handleAccept}
            className="flex flex-col items-center gap-2 transition-transform hover:scale-110 active:scale-95"
            title="Chấp nhận"
          >
            <div
              className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 0 0 8px rgba(34,197,94,0.18)" }}
            >
              {/* Phone icon */}
              <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
                <path
                  d="M16.95 18C14.8667 18 12.8083 17.5458 10.775 16.6375C8.74167 15.7292 6.89167 14.4417 5.225 12.775C3.55833 11.1083 2.27083 9.25833 1.3625 7.225C0.454167 5.19167 0 3.13333 0 1.05C0 0.75 0.1 0.5 0.3 0.3C0.5 0.1 0.75 0 1.05 0H5.1C5.33333 0 5.54167 0.0791667 5.725 0.2375C5.90833 0.395833 6.01667 0.583333 6.05 0.8L6.7 4.3C6.73333 4.56667 6.725 4.79167 6.675 4.975C6.625 5.15833 6.53333 5.31667 6.4 5.45L3.975 7.9C4.30833 8.51667 4.70417 9.1125 5.1625 9.6875C5.62083 10.2625 6.125 10.8167 6.675 11.35C7.19167 11.8667 7.73333 12.3458 8.3 12.7875C8.86667 13.2292 9.46667 13.6333 10.1 14L12.45 11.65C12.6 11.5 12.7958 11.3875 13.0375 11.3125C13.2792 11.2375 13.5167 11.2167 13.75 11.25L17.2 11.95C17.4333 12.0167 17.625 12.1375 17.775 12.3125C17.925 12.4875 18 12.6833 18 12.9V16.95C18 17.25 17.9 17.5 17.7 17.7C17.5 17.9 17.25 18 16.95 18Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="text-white/70 text-xs font-semibold">Chấp nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
}
