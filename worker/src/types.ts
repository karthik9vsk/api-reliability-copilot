export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  history: ChatMessage[];
}

export interface Env {
  AI: Ai;
  INCIDENT_SESSION: DurableObjectNamespace;
}