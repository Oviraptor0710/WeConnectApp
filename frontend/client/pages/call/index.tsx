import "@livekit/components-styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import Pusher from "pusher-js";
import { getCurrentUser } from "@/lib/auth";
import { getPusherConfig } from "@/lib/chatApi";
import { API_BASE_URL } from "@/lib/api";
import { fetchVideoToken, rejectCall } from "@/lib/videoApi";
import { useTranslation } from "react-i18next";

// ─── Environment ─────────────────────────────────────────────────────────────

const LIVEKIT_URL = (import.meta.env.VITE_LIVEKIT_URL as string) || "";

// ─── Types ───────────────────────────────────────────────────────────────────

type CallState = "connecting" | "connected" | "ended";

// ─── CallControls (requires LiveKitRoom context) ──────────────────────────────

function CallControls({
  partnerName,
  partnerAvatar,
  partnerId,
  onEnd,
}: {
  partnerName: string;
  partnerAvatar: string | null;
  partnerId: number;
  onEnd: () => void;
}) {
  const { t } = useTranslation();
  const room = useRoomContext();
  const { localParticipant, cameraTrack } = useLocalParticipant();
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callState, setCallState] = useState<CallState>("connecting");
  const [statusMsg, setStatusMsg] = useState(t("call.calling"));
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  // True when remote participant has an active video track being rendered
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);

  // ── Handle browser autoplay audio block ────────────────────────────
  useEffect(() => {
    // Try to start audio immediately (works if user has interacted with page)
    if (!room.canPlaybackAudio) {
      room.startAudio().catch(() => setAudioBlocked(true));
    }

    const handleAudioChanged = () => {
      if (room.canPlaybackAudio) {
        setAudioBlocked(false);
      } else {
        // Browser blocked autoplay — we need a user gesture
        setAudioBlocked(true);
      }
    };

    room.on(RoomEvent.AudioPlaybackStatusChanged, handleAudioChanged);
    return () => { room.off(RoomEvent.AudioPlaybackStatusChanged, handleAudioChanged); };
  }, [room]);
  // ── Listen for rejection + 35s no-answer timeout ─────────────────────────
  useEffect(() => {
    let pusher: Pusher | null = null;
    let cancelled = false;

    // ── Pusher: listen for "video:call-rejected" on own channel ──
    async function setupRejectionListener() {
      const user = getCurrentUser();
      if (!user) return;
      try {
        const config = await getPusherConfig();
        if (cancelled) return;
        const token = localStorage.getItem("access_token") ?? "";
        pusher = new Pusher(config.data.key, {
          cluster: config.data.cluster,
          authEndpoint: `${API_BASE_URL}${config.data.auth_endpoint}`,
          auth: { headers: { Authorization: `Bearer ${token}` } },
        });
        const channel = pusher.subscribe(`private-user-${user.user_id}`);
        channel.bind("video:call-rejected", (data: { reason: string }) => {
          const msg =
            data.reason === "TIMEOUT"
              ? t("call.noAnswer")
              : t("call.rejected");
          setStatusMsg(msg);
          setCallState("ended");
          // Auto-navigate back after showing message
          setTimeout(onEnd, 2500);
        });
      } catch {
        // Pusher optional — timeout still works
      }
    }

    setupRejectionListener();

    // 35s hard timeout: if no remote participant joined, give up
    const timeoutId = window.setTimeout(() => {
      if (room.remoteParticipants.size === 0) {
        setStatusMsg(t("call.noAnswer"));
        setCallState("ended");
        setTimeout(onEnd, 2500);
      }
    }, 35_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (pusher) pusher.disconnect();
    };
  }, [room, onEnd]);

  // ── Sync room state using LiveKit events (not dependency array) ──────────
  useEffect(() => {
    // Remote participant joined → both sides show "connected"
    const handleParticipantConnected = () => {
      setCallState("connected");
      setStatusMsg(t("call.connected"));
    };

    // Remote participant left → notify remaining user and navigate back
    const handleParticipantDisconnected = () => {
      // Only act if we are still in the call (not already ending ourselves)
      setStatusMsg(t("call.partnerEnded"));
      setCallState("ended");
      setTimeout(onEnd, 2000);
    };

    // Local client connected to room
    const handleConnected = () => {
      if (room.remoteParticipants.size > 0) {
        setCallState("connected");
        setStatusMsg(t("call.connected"));
      }
    };

    // Local client disconnected (we ended the call ourselves)
    const handleDisconnected = () => {
      onEnd();
    };

    // Edge-case: B joined before this effect ran
    if (room.remoteParticipants.size > 0) {
      setCallState("connected");
      setStatusMsg(t("call.connected"));
    }

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, onEnd]);

  // ── Attach local camera video ──────────────────────────────────────────────
  // Use `cameraTrack` from useLocalParticipant (reactive — updates when track publishes)
  useEffect(() => {
    const videoEl = localVideoRef.current;
    const track = cameraTrack?.videoTrack;
    if (!videoEl || !track) return;
    track.attach(videoEl);
    return () => { track.detach(videoEl); };
  }, [cameraTrack]);

  // ── Attach remote video ───────────────────────────────────────────────────
  // Video element is always in DOM (controlled by CSS), so ref is always valid.
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    const tryAttach = () => {
      for (const participant of room.remoteParticipants.values()) {
        for (const pub of participant.getTrackPublications()) {
          if (pub.track?.kind === Track.Kind.Video) {
            pub.track.attach(videoEl);
            // Only show overlay as hidden if the track is currently unmuted
            setRemoteVideoActive(!pub.isMuted);
            return;
          }
        }
      }
    };

    const handleTrackSubscribed = (track: { kind: string; attach: (el: HTMLVideoElement) => void; isMuted: boolean }) => {
      if (track.kind === Track.Kind.Video) {
        track.attach(videoEl);
        // Track may already be muted if remote turned off camera before local joined
        setRemoteVideoActive(!track.isMuted);
      }
    };

    const handleTrackUnsubscribed = (track: { kind: string; detach: (el: HTMLVideoElement) => void }) => {
      if (track.kind === Track.Kind.Video) {
        track.detach(videoEl);
        setRemoteVideoActive(false);
      }
    };

    // Fired when remote participant mutes their camera (track stays subscribed)
    // Must check !participant.isLocal — these events also fire for the local participant
    const handleTrackMuted = (pub: { kind: string }, participant: { isLocal: boolean }) => {
      if (pub.kind === Track.Kind.Video && !participant.isLocal) setRemoteVideoActive(false);
    };

    const handleTrackUnmuted = (pub: { kind: string }, participant: { isLocal: boolean }) => {
      if (pub.kind === Track.Kind.Video && !participant.isLocal) setRemoteVideoActive(true);
    };

    tryAttach();
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed as never);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed as never);
    room.on(RoomEvent.TrackMuted, handleTrackMuted as never);
    room.on(RoomEvent.TrackUnmuted, handleTrackUnmuted as never);
    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed as never);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed as never);
      room.off(RoomEvent.TrackMuted, handleTrackMuted as never);
      room.off(RoomEvent.TrackUnmuted, handleTrackUnmuted as never);
    };
  }, [room]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleToggleMic = useCallback(async () => {
    if (!localParticipant) return;
    const nextMuted = !muted;
    await localParticipant.setMicrophoneEnabled(!nextMuted);
    setMuted(nextMuted);
  }, [localParticipant, muted]);

  const handleToggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    const nextEnabled = !videoEnabled;
    await localParticipant.setCameraEnabled(nextEnabled);
    setVideoEnabled(nextEnabled);
  }, [localParticipant, videoEnabled]);

  const handleEndCall = useCallback(async () => {
    // If still waiting (connecting), notify the other side we cancelled
    if (callState === "connecting") {
      rejectCall(partnerId, "REJECTED").catch(() => {});
    }
    await room.disconnect();
    onEnd();
  }, [room, onEnd, callState, partnerId]);

  // ── Status indicator ──────────────────────────────────────────────────────
  const statusDot =
    callState === "connecting"
      ? "bg-yellow-400 animate-pulse"
      : callState === "connected"
      ? "bg-green-400"
      : "bg-red-400";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Blurred background */}
      {partnerAvatar ? (
        <img
          src={partnerAvatar}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(24px)", transform: "scale(1.1)" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1a2a1a 0%, #0d1a0d 50%, #0a1a1a 100%)",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.70) 100%)",
        }}
      />

      {/* Remote video (fullscreen) — always in DOM so ref is valid; hidden until connected */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={false}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ display: callState === "connected" ? "block" : "none" }}
      />

      {/* Local video PiP — always in DOM; hidden until connected + camera on */}
      <div
        className="absolute bottom-32 right-4 z-20 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: 120,
          height: 180,
          border: "2px solid rgba(255,255,255,0.20)",
          display: videoEnabled && callState === "connected" ? "block" : "none",
        }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Audio renderer — handles remote participant audio playback */}
      <RoomAudioRenderer />

      {/* Audio blocked banner — shown when browser needs a user gesture */}
      {audioBlocked && (
        <button
          onClick={() => room.startAudio()}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white animate-bounce"
          style={{
            background: "rgba(239,68,68,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.20)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {t("call.clickToUnmuteAudio")}
        </button>
      )}

      {/* Back button — no-op during active call, intentionally does nothing */}
      <button
        id="btn-call-back"
        onClick={callState === "ended" ? onEnd : undefined}
        className="absolute top-8 left-8 z-30 flex items-center justify-center w-10 h-10 rounded-full transition-opacity hover:opacity-80"
        style={{
          background: "rgba(0,0,0,0.30)",
          backdropFilter: "blur(4px)",
          opacity: callState === "ended" ? 1 : 0.4,
          cursor: callState === "ended" ? "pointer" : "default",
        }}
        title={callState === "ended" ? t("call.goBack") : ""}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.825 9L9.425 14.6L8 16L0 8L8 0L9.425 1.4L3.825 7H16V9H3.825Z"
            fill="white"
            fillOpacity="0.85"
          />
        </svg>
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-16 px-8">
        {/* Top: Avatar + Name + Status — hidden when remote video is active */}
        <div
          className="flex flex-col items-center gap-2 pt-10"
          style={{
            opacity: callState === "connected" && remoteVideoActive ? 0 : 1,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        >
          {/* Avatar with animated ring */}
          <div className="relative flex items-center justify-center">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="w-40 h-40 rounded-full object-cover"
                style={{
                  border: "4px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.40)",
                }}
              />
            ) : (
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(74,103,65,0.60)",
                  border: "4px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.40)",
                }}
              >
                <span className="text-white font-bold" style={{ fontSize: 56 }}>
                  {partnerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {callState === "connecting" && (
              <div
                className="absolute rounded-full pointer-events-none animate-ping"
                style={{
                  width: "calc(100% + 24px)",
                  height: "calc(100% + 24px)",
                  border: "2px solid rgba(78,222,163,0.35)",
                  animationDuration: "2s",
                }}
              />
            )}
          </div>

          {/* Name + Status */}
          <div className="pt-6 flex flex-col items-center gap-2">
            <h1
              className="text-white font-bold text-center"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "36px",
                lineHeight: "40px",
                letterSpacing: "-0.9px",
              }}
            >
              {partnerName}
            </h1>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full block ${statusDot}`} />
              <span
                className="text-white/70 font-medium"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "16px" }}
              >
                {statusMsg}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom controls — hidden when call has ended */}
        {callState !== "ended" && (
        <div className="flex flex-col items-center gap-10">
          <div className="flex items-center gap-10">
            {/* Mic toggle */}
            <button
              id="btn-toggle-mic"
              onClick={handleToggleMic}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
              title={muted ? "Bật tiếng" : "Tắt tiếng"}
            >
              <div
                className="flex w-16 h-16 items-center justify-center rounded-full transition-colors"
                style={{
                  border: "1px solid rgba(255,255,255,0.20)",
                  background: muted ? "rgba(239,68,68,0.40)" : "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {muted ? (
                  <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
                    <path
                      d="M2 2L20 20M9.5 4.5A3 3 0 0115 7.5V8M15 11.5V11.25C15 12.2917 14.6354 13.1771 13.9062 13.9062C13.1771 14.6354 12.2917 15 11.25 15C10.5 15 9.8 14.75 9.2 14.3M7.5 11.25V3.75A3.75 3.75 0 0111.25 0C12.1 0 12.9 0.25 13.5 0.7M11.25 17.5V21.25M7.5 21.25H15M2 9C2 11 2.7 12.8 3.8 14.2"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
                    <path
                      d="M8.75 15C7.70833 15 6.82292 14.6354 6.09375 13.9062C5.36458 13.1771 5 12.2917 5 11.25V3.75C5 2.70833 5.36458 1.82292 6.09375 1.09375C6.82292 0.364583 7.70833 0 8.75 0C9.79167 0 10.6771 0.364583 11.4062 1.09375C12.1354 1.82292 12.5 2.70833 12.5 3.75V11.25C12.5 12.2917 12.1354 13.1771 11.4062 13.9062C10.6771 14.6354 9.79167 15 8.75 15ZM7.5 23.75V19.9062C5.33333 19.6146 3.54167 18.6458 2.125 17C0.708333 15.3542 0 13.4375 0 11.25H2.5C2.5 12.9792 3.10938 14.4531 4.32812 15.6719C5.54688 16.8906 7.02083 17.5 8.75 17.5C10.4792 17.5 11.9531 16.8906 13.1719 15.6719C14.3906 14.4531 15 12.9792 15 11.25H17.5C17.5 13.4375 16.7917 15.3542 15.375 17C13.9583 18.6458 12.1667 19.6146 10 19.9062V23.75H7.5Z"
                      fill="white"
                    />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                {muted ? t("call.unmuteMic") : t("call.muteMic")}
              </span>
            </button>

            {/* Camera toggle */}
            <button
              id="btn-toggle-camera"
              onClick={handleToggleCamera}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
              title={videoEnabled ? "Tắt camera" : "Bật camera"}
            >
              <div
                className="flex w-16 h-16 items-center justify-center rounded-full transition-colors"
                style={{
                  border: "1px solid rgba(255,255,255,0.20)",
                  background: !videoEnabled ? "rgba(239,68,68,0.40)" : "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                  <path
                    d="M0 15.5V2.5C0 1.80625 0.246875 1.21354 0.740625 0.721875C1.23438 0.230208 1.82708 -0.000416667 2.51667 0H14.4833C15.1729 0 15.7656 0.230208 16.2594 0.690625C16.7531 1.15104 17 1.7125 17 2.375V6.9375L22.1667 1.8125V16.1875L17 11.0625V15.5C17 16.175 16.7521 16.7479 16.2563 17.2188C15.7604 17.6896 15.1667 17.9375 14.475 17.9375H2.525C1.83333 17.9375 1.23958 17.6896 0.74375 17.1938C0.247917 16.6979 0 16.1042 0 15.5ZM2 15.5H15V2.5H2V15.5ZM17 14L20.1667 10.8V7.2L17 4V14Z"
                    fill="white"
                  />
                </svg>
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                {videoEnabled ? t("call.disableCam") : t("call.enableCam")}
              </span>
            </button>
          </div>

          {/* End call button */}
          <div className="flex flex-col items-center gap-3">
            <button
              id="btn-end-call"
              onClick={handleEndCall}
              className="relative flex w-20 h-20 items-center justify-center rounded-full bg-red-500 transition-transform hover:scale-105 active:scale-95"
              style={{ boxShadow: "0 0 0 10px rgba(239,68,68,0.22), 0 25px 50px -12px rgba(0,0,0,0.35)" }}
              title="Kết thúc cuộc gọi"
            >
              <svg width="39" height="39" viewBox="0 0 39 39" fill="none">
                <path
                  d="M1.11369 17.9782C3.3234 15.7685 5.98831 14.067 9.10842 12.8738C12.2285 11.6805 15.5564 11.0839 19.0919 11.0839C22.6274 11.0839 25.9552 11.6805 29.0754 12.8738C32.1955 14.067 34.8604 15.7685 37.0701 17.9782C37.3883 18.2964 37.5474 18.6676 37.5474 19.0919C37.5474 19.5162 37.3883 19.8874 37.0701 20.2056L32.7744 24.5013C32.5269 24.7487 32.222 24.8857 31.8596 24.9123C31.4972 24.9388 31.1834 24.8548 30.9183 24.6604L26.5165 21.6375C26.1983 21.39 25.9685 21.1425 25.8271 20.895C25.6857 20.6475 25.615 20.3824 25.615 20.0995L25.5884 14.9288C24.5808 14.6283 23.529 14.4161 22.433 14.2924C21.337 14.1687 20.2144 14.1156 19.0654 14.1333C17.9694 14.1333 16.8866 14.1996 15.8171 14.3322C14.7476 14.4648 13.6825 14.6725 12.6219 14.9553V19.9404C12.6219 20.2586 12.5335 20.5857 12.3567 20.9215C12.1799 21.2574 11.9501 21.5314 11.6673 21.7435L7.26553 24.6604C6.94733 24.8371 6.61587 24.9123 6.27116 24.8857C5.92644 24.8592 5.63918 24.7311 5.40937 24.5013L1.11369 20.2056C0.795495 19.8874 0.636397 19.5162 0.636397 19.0919C0.636397 18.6676 0.795495 18.2964 1.11369 17.9782Z"
                  fill="white"
                />
              </svg>
            </button>
            <span
              className="text-white font-bold tracking-widest uppercase"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", letterSpacing: "1.4px" }}
            >
              {callState === "connecting" ? t("call.cancelCall") : t("call.endCall")}
            </span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2a0d0d 50%, #1a0a0a 100%)" }}
    >
      <div
        className="rounded-3xl p-10 flex flex-col items-center gap-6 text-center max-w-sm mx-4"
        style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-white font-bold text-xl mb-2">{t("call.connectionError")}</h2>
          <p className="text-white/60 text-sm">{message}</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
        >
          {t("call.goBackChat")}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CallPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomName = searchParams.get("room") ?? "";
  const partnerName = searchParams.get("partner") ?? "Người dùng";
  const partnerAvatar = searchParams.get("avatar") ?? null;
  const partnerId = Number(searchParams.get("partner_id") ?? "0");

  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guard: no room → back to chat
  useEffect(() => {
    if (!roomName) navigate("/chat", { replace: true });
  }, [roomName, navigate]);

  // Fetch LiveKit token
  useEffect(() => {
    if (!roomName) return;
    let cancelled = false;
    fetchVideoToken(roomName)
      .then((t) => { if (!cancelled) setToken(t); })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("call.connectionError"));
      });
    return () => { cancelled = true; };
  }, [roomName]);

  const handleCallEnd = useCallback(() => navigate("/chat"), [navigate]);
  const handleRoomError = useCallback((err: Error) => {
    // "Client initiated disconnect" is NOT an error — it fires when we call
    // room.disconnect() ourselves. Just navigate back silently.
    if (err.message?.toLowerCase().includes("client initiated disconnect")) {
      navigate("/chat");
      return;
    }
    setError(err.message || t("call.connectionError"));
  }, [navigate, t]);

  if (error) return <ErrorScreen message={error} onBack={handleCallEnd} />;

  // Loading spinner while waiting for token
  if (!token) {
    return (
      <div
        className="w-full h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(135deg, #0d1a0d 0%, #0a160a 50%, #0a1a1a 100%)" }}
      >
        <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-[#4EDEA3] animate-spin" />
        <p className="text-white/60 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
          {t("call.connectingRoom")}
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={LIVEKIT_URL}
      data-lk-theme="default"
      onError={handleRoomError}
      options={{ adaptiveStream: true, dynacast: true }}
      style={{ height: "100dvh" }}
    >
      <CallControls
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        partnerId={partnerId}
        onEnd={handleCallEnd}
      />
    </LiveKitRoom>
  );
}
