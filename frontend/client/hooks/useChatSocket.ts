import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, ChatConversation } from '@/lib/chatApi';
import { API_BASE_URL } from '@/lib/api';

const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_BASE_URL;

interface UseChatSocketProps {
  currentUserId: number | null;
  onNewMessage: (message: ChatMessage) => void;
  onTyping: (payload: { conversation_id: number; user_id: number; is_typing: boolean }) => void;
  onRead: (payload: { conversation_id: number; user_id: number; last_read_message_id?: number | null }) => void;
  onTranslated: (payload: {
    message_id: number;
    translated_content: string;
    source_language: "VI" | "JA";
    target_language: "VI" | "JA";
  }) => void;
  onConversationUpdated: (conversation: ChatConversation) => void;
}

export function useChatSocket({
  currentUserId,
  onNewMessage,
  onTyping,
  onRead,
  onTranslated,
  onConversationUpdated,
}: UseChatSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isReady, setIsReady] = useState(false);

  const callbacksRef = useRef({
    onNewMessage,
    onTyping,
    onRead,
    onTranslated,
    onConversationUpdated,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onTyping,
      onRead,
      onTranslated,
      onConversationUpdated,
    };
  });

  // 1. Establish connection when user logs in
  useEffect(() => {
    if (!currentUserId) return;

    const socket = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to Chat Socket');
      setIsReady(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Chat Socket');
      setIsReady(false);
    });

    // Mọi event chat đều được backend gửi vào private-user-{id}. Client không
    // tự join room conversation, nên không thể nghe lén hội thoại bất kỳ.
    const handleNewMessage = (payload: ChatMessage) => callbacksRef.current.onNewMessage(payload);
    const handleTyping = (payload: { conversation_id: number; user_id: number; is_typing: boolean }) =>
      callbacksRef.current.onTyping(payload);
    const handleRead = (payload: { conversation_id: number; user_id: number; last_read_message_id?: number | null }) =>
      callbacksRef.current.onRead(payload);
    const handleTranslated = (payload: {
      message_id: number;
      translated_content: string;
      source_language: "VI" | "JA";
      target_language: "VI" | "JA";
    }) =>
      callbacksRef.current.onTranslated(payload);
    const handleConversationUpdated = (payload: ChatConversation) =>
      callbacksRef.current.onConversationUpdated(payload);

    socket.on('chat:new', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);
    socket.on('chat:translated', handleTranslated);
    socket.on('conversation:updated', handleConversationUpdated);

    socketRef.current = socket;

    return () => {
      socket.off('chat:new', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
      socket.off('chat:translated', handleTranslated);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  return { socket: socketRef.current, isReady };
}
