import { useMemo, useState, useEffect } from "react";
import { resetSession, sendMessage, type Message } from "./api";

function createSessionId() {
  return `session-${crypto.randomUUID()}`;
}

/* ✅ Copy Button with feedback */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <button
      className={`copy-btn ${copied ? "copied" : ""}`}
      onClick={handleCopy}
    >
      {copied ? "Copied ✓" : "Copy response"}
    </button>
  );
}

/* ✅ Typing animation */
function TypingMessage({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayed("");

    const interval = setInterval(() => {
      index += 3;
      setDisplayed(content.slice(0, index));

      if (index >= content.length) clearInterval(interval);
    }, 12);

    return () => clearInterval(interval);
  }, [content]);

  return <pre>{displayed}</pre>;
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

    const submittedMessage = input.trim();
    setLoading(true);

    try {
      const response = await sendMessage(sessionId, submittedMessage);
      setMessages(response.history);
      setInput("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Request failed.";

      setMessages((prev) => [
        ...prev,
        { role: "user", content: submittedMessage },
        { role: "assistant", content: message }
      ]);
      setInput("");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    await resetSession(sessionId);
    setMessages([]);
    setSessionId(createSessionId());
  }

  const latestAssistantIndex = [...messages]
    .map((msg, idx) => ({ msg, idx }))
    .filter((item) => item.msg.role === "assistant")
    .map((item) => item.idx)
    .pop();

  return (
    <div className="page-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />
      <div className="grid-overlay" />

      <div className="app-shell">
        {/* Header */}
        <header className="hero">
          <div className="hero-badge">
            Cloudflare Workers + AI + Durable Objects
          </div>

          <h1>API Reliability Copilot</h1>

          <p>
            Paste an API incident, log snippet, latency spike, or failing endpoint
            and get a structured debugging response.
          </p>

          <div className="hero-stats">
            <div className="stat-chip">
              <span className="stat-dot blue" />
              Incident analysis
            </div>
            <div className="stat-chip">
              <span className="stat-dot green" />
              Session memory
            </div>
            <div className="stat-chip">
              <span className="stat-dot purple" />
              Structured remediation
            </div>
          </div>
        </header>

        {/* Panel */}
        <section className="panel">
          <div className="toolbar">
            <button onClick={() => setInput(example)}>Use example</button>
            <button onClick={handleReset}>Reset session</button>
          </div>

          {/* Chat */}
          <div className="chat-window">
            {messages.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon">⌁</div>
                <h3>No incident analyzed yet</h3>
                <p>
                  Try pasting a production issue such as a 502 spike, timeout error,
                  upstream dependency failure, or latency regression after deployment.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`bubble ${msg.role}`}>
                    <div className="bubble-top">
                      <div className="role">
                        {msg.role === "user" ? "You" : "Copilot"}
                      </div>

                      {msg.role === "assistant" && (
                        <CopyButton text={msg.content} />
                      )}
                    </div>

                    {msg.role === "assistant" && idx === latestAssistantIndex ? (
                      <TypingMessage content={msg.content} />
                    ) : (
                      <pre>{msg.content}</pre>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="bubble assistant loading-bubble">
                    <div className="bubble-top">
                      <div className="role">Copilot</div>
                    </div>

                    <div className="loading-wrap">
                      <div className="loading-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="loading-text">
                        Analyzing incident, checking likely root causes...
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="composer">
            <label className="composer-label">Incident input</label>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the incident, logs, endpoint, and symptoms..."
              rows={6}
            />

            <button
              className="primary-action"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze incident"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}