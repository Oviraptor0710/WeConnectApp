import { apiFetch } from "./api";

export interface ChatUserBrief {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
}

export interface ChatLastMessage {
  message_id: number;
  content: string;
  type: string;
  created_at: string;
  sender_id: number;
}

export interface ChatConversation {
  conversation_id: number;
  participant: ChatUserBrief;
  last_message?: ChatLastMessage | null;
  unread_count: number;
  last_message_at?: string | null;
  created_at: string;
}

export interface ChatMessage {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: string;
  translated_content?: string | null;
  created_at: string;
  is_read: boolean;
}

export interface PusherConfig {
  key: string;
  cluster: string;
  auth_endpoint: string;
}

export function listConversations() {
  return apiFetch<{ data: ChatConversation[]; pagination: unknown }>("/api/v1/conversations");
}

export function createOrGetConversation(receiverId: number) {
  return apiFetch<{ data: ChatConversation }>("/api/v1/conversations", {
    method: "POST",
    body: JSON.stringify({ receiver_id: receiverId }),
  });
}

export function listMessages(conversationId: number) {
  return apiFetch<{ data: ChatMessage[]; next_cursor?: number | null }>(
    `/api/v1/conversations/${conversationId}/messages?limit=50`
  );
}

export function sendMessage(conversationId: number, content: string, type: string = "TEXT") {
  return apiFetch<{ data: ChatMessage }>(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, type }),
  });
}

/**
 * Invite a friend into a game room by sending them a GAME_INVITE chat message.
 * The message content is the room code; the chat UI renders it as a join card.
 */
export async function inviteFriendToGameRoom(friendId: number, roomCode: string) {
  const conversation = await createOrGetConversation(friendId);
  return sendMessage(conversation.data.conversation_id, roomCode, "GAME_INVITE");
}

export function markConversationRead(conversationId: number, lastReadMessageId?: number) {
  return apiFetch<null>(`/api/v1/conversations/${conversationId}/read`, {
    method: "POST",
    body: JSON.stringify({ last_read_message_id: lastReadMessageId ?? null }),
  });
}

export function sendTypingStatus(conversationId: number, isTyping: boolean) {
  return apiFetch<null>(`/api/v1/conversations/${conversationId}/typing`, {
    method: "POST",
    body: JSON.stringify({ is_typing: isTyping }),
  });
}

export function translateMessage(messageId: number, targetLanguage: "VI" | "JA" | "EN" = "VI") {
  return apiFetch<{
    data: {
      message_id: number;
      original_content: string;
      translated_content: string;
      target_language: "VI" | "JA" | "EN";
    };
  }>(`/api/v1/messages/${messageId}/translate`, {
    method: "POST",
    body: JSON.stringify({ target_language: targetLanguage }),
  });
}

export function getPusherConfig() {
  return apiFetch<{ data: PusherConfig }>("/api/v1/pusher/config");
}

export function uploadChatFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<{ data: { url: string } }>("/api/v1/upload", {
    method: "POST",
    body: formData,
  });
}
