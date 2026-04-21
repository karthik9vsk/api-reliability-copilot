import { buildMessages } from "./prompts";
import type { ChatRequest, ChatResponse, Env } from "./types";
import { IncidentSession } from "./IncidentSession";

export { IncidentSession };

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as ChatRequest;
  const { sessionId, message } = body;

  if (!sessionId || !message) {
    return Response.json({ error: "sessionId and message are required" }, { status: 400 });
  }

  const id = env.INCIDENT_SESSION.idFromName(sessionId);
  const stub = env.INCIDENT_SESSION.get(id);

  const historyRes = await stub.fetch("https://session/history");
  const { history } = (await historyRes.json()) as {
    history: { role: "user" | "assistant"; content: string }[];
  };

  await stub.fetch("https://session/append", {
    method: "POST",
    body: JSON.stringify({ role: "user", content: message })
  });

  const messages = buildMessages(history, message);

  const aiResult = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages
  });

  const reply =
    typeof aiResult === "object" && aiResult && "response" in aiResult
      ? String((aiResult as { response: string }).response)
      : "I could not generate a response.";

  const appendAssistantRes = await stub.fetch("https://session/append", {
    method: "POST",
    body: JSON.stringify({ role: "assistant", content: reply })
  });

  const updated = (await appendAssistantRes.json()) as {
    history: { role: "user" | "assistant"; content: string }[];
  };

  const response: ChatResponse = {
    reply,
    history: updated.history
  };

  return withCors(Response.json(response));
}

async function handleReset(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { sessionId: string };

  if (!body.sessionId) {
    return withCors(Response.json({ error: "sessionId is required" }, { status: 400 }));
  }

  const id = env.INCIDENT_SESSION.idFromName(body.sessionId);
  const stub = env.INCIDENT_SESSION.get(id);
  await stub.fetch("https://session/clear", { method: "POST" });

  return withCors(Response.json({ ok: true }));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return withCors(
        Response.json({
          name: "Cloudflare API Reliability Copilot",
          status: "ok"
        })
      );
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      return handleChat(request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/reset") {
      return handleReset(request, env);
    }

    return withCors(new Response("Not found", { status: 404 }));
  }
};