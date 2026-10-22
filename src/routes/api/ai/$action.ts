import { createFileRoute } from "@tanstack/react-router";
import { handleAiRequest, statusResponse } from "@/lib/ai/handler.server";

/**
 * Grok endpoints (server-only):
 *   GET  /api/ai/status            → { available, model }
 *   POST /api/ai/{example|context}
 */
export const Route = createFileRoute("/api/ai/$action")({
  server: {
    handlers: {
      GET: ({ params }) =>
        params.action === "status" ? statusResponse() : new Response("Not found", { status: 404 }),
      POST: ({ request, params }) => handleAiRequest(request, params.action),
    },
  },
});
