/// <reference lib="dom" />
export interface Message {
  role: "user" | "assistant";
  content: string;
}

const WORKER_BASE = "http://localhost:8787";

export async function sendMessage(sessionId: string, message: string) {
  const res = await fetch(`${WORKER_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sessionId, message })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send message: ${res.status} ${text}`);
  }

  return (await res.json()) as { reply: string; history: Message[] };
}

export async function resetSession(sessionId: string) {
  const res = await fetch(`${WORKER_BASE}/api/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sessionId })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to reset session: ${res.status} ${text}`);
  }
}