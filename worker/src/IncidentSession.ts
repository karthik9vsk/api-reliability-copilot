import { DurableObject } from "cloudflare:workers";
import type { ChatMessage, Env } from "./types";

export class IncidentSession extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async getHistory(): Promise<ChatMessage[]> {
    return (await this.ctx.storage.get<ChatMessage[]>("history")) ?? [];
  }

  async appendMessage(message: ChatMessage): Promise<ChatMessage[]> {
    const history = await this.getHistory();
    history.push(message);
    await this.ctx.storage.put("history", history);
    return history;
  }

  async clearHistory(): Promise<void> {
    await this.ctx.storage.put("history", []);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/history") {
      const history = await this.getHistory();
      return Response.json({ history });
    }

    if (request.method === "POST" && url.pathname === "/append") {
      const message = (await request.json()) as ChatMessage;
      const history = await this.appendMessage(message);
      return Response.json({ history });
    }

    if (request.method === "POST" && url.pathname === "/clear") {
      await this.clearHistory();
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}