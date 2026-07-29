export type ChatRole = 'user' | 'assistant';

export interface ChatSource {
  document_id?: string | null;
  title?: string | null;
  original_file_name?: string | null;
  page?: number | null;
  chunk_index?: number | null;
  source?: string | null;
}

export interface ChatMessage {
  message_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  sources?: ChatSource[];
  pending?: boolean;
  failed?: boolean;
}

export interface SendChatRequest {
  conversation_id?: string | null;
  question: string;
}

export interface SendChatResponse {
  conversation_id: string;
  message: ChatMessage;
  sources: ChatSource[];
}

export interface Conversation {
  conversation_id: string;
  title: string;
  building_code: string;
  last_message?: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  items: Conversation[];
  page: number;
  page_size: number;
  total: number;
}

export interface MessageListResponse {
  conversation_id: string;
  items: ChatMessage[];
  page: number;
  page_size: number;
  total: number;
}
