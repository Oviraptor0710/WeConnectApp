import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, ChatConversation } from '@/lib/chatApi';
import { API_BASE_URL } from '@/lib/api';

const WS_URL = (import.meta.env.VITE_WS_URL as string) || API_BASE_URL;

interface UseChatSocketProps {
  currentUserId: number | null;
  activeConversationId?: number | null;
  onNewMessage: (message: ChatMessage) => void;
  onTyping: (payload: { conversation_id: number; user_id: number; is_typing: boolean }) => void;
  onRead: (payload: { user_id: number; last_read_message_id?: number | null }) => void;
  onTranslated: (payload: { message_id: number; translated_content: string }) => void;
  onConversationUpdated: (conversation: ChatConversation) => void;
}

export function useChatSocket({
  currentUserId,
  activeConversationId,
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

    // Handle global events (user room)
    socket.on('conversation:updated', (payload: ChatConversation) => {
      callbacksRef.current.onConversationUpdated(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  // 2. Handle room subscription when active conversation changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!isReady || !socket || !activeConversationId || !currentUserId) return;

    const channelName = `private-conversation-${activeConversationId}`;
    
    // Join room
    socket.emit('subscribe_channel', { channel: channelName });

    // Bind room events using refs to avoid stale closures
    const handleNewMessage = (payload: any) => callbacksRef.current.onNewMessage(payload);
    const handleTyping = (payload: any) => callbacksRef.current.onTyping(payload);
    const handleRead = (payload: any) => callbacksRef.current.onRead(payload);
    const handleTranslated = (payload: any) => callbacksRef.current.onTranslated(payload);

    socket.on('chat:new', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);
    socket.on('chat:translated', handleTranslated);

    return () => {
      socket.off('chat:new', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
      socket.off('chat:translated', handleTranslated);
      
      socket.emit('unsubscribe_channel', { channel: channelName });
    };
  }, [activeConversationId, currentUserId, isReady]);

  return { socket: socketRef.current, isReady };
}
