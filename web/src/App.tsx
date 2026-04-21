import { useMemo, useState } from "react";
import { resetSession, sendMessage, type Message } from "./api";

function createSessionId() {
  return `session-${crypto.randomUUID()}`;
}

export default function App() {
  const [sessionId, setSessionId] = useState(createSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const example = useMemo(
    () =>
      "POST /payments returns 502 after deployment. P95 latency rose from 120ms to 780ms. Logs show upstream timeout errors from the billing service.",
    []
  );

  async function handleSend() {
    if (!input.trim() || loading) return;
    setLoading(true);

    try {
      const response = await sendMessage(sessionId, input.trim());
      setMessages(response.history);
      setInput("");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Request failed. Make sure the Worker is running locally on port 8787."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    await resetSession(sessionId);
    setMessages([]);
    setSessionId(createSessionId());
  }

  return (
    <div className="app-shell">
      <div className="header">
        <h1>API Reliability Copilot</h1>
        <p>
          Paste an API incident, log snippet, latency spike, or failing endpoint and get a structured debugging response.
        </p>
      </div>

      <div className="panel">
        <div className="toolbar">
          <button onClick={() => setInput(example)}>Use example</button>
          <button onClick={handleReset}>Reset session</button>
        </div>

        <div className="chat-window">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages yet.</p>
              <p>Try describing an API timeout, elevated latency, or consumer lag issue.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`bubble ${msg.role}`}>
                <div className="role">{msg.role === "user" ? "You" : "Copilot"}</div>
                <pre>{msg.content}</pre>
                {msg.role === "assistant" && (
                  <button
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                  >
                    Copy
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the incident, logs, endpoint, and symptoms..."
            rows={6}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze incident"}
          </button>
        </div>
      </div>
    </div>
  );
}