import type { AiStatus, ContextResponse, ExampleResponse } from "@/lib/ai/config";

let statusPromise: Promise<AiStatus> | null = null;

export function getAiStatus(): Promise<AiStatus> {
  statusPromise ??= fetch("/api/ai/status", { headers: { accept: "application/json" } })
    .then((res) => (res.ok ? (res.json() as Promise<AiStatus>) : { available: false, model: null }))
    .catch(() => {
      statusPromise = null;
      return { available: false, model: null };
    });
  return statusPromise;
}

async function post<T>(action: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/ai/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!res.ok || !data) throw new Error(data?.message || "Grok couldn't answer just now.");
  return data;
}

const exampleCache = new Map<string, Promise<ExampleResponse>>();

export function fetchAiExample(input: { word: string; partOfSpeech: string; definition: string }) {
  const key = `${input.word}|${input.definition}`.toLowerCase();
  let pending = exampleCache.get(key);
  if (!pending) {
    pending = post<ExampleResponse>("example", input);
    pending.catch(() => exampleCache.delete(key));
    exampleCache.set(key, pending);
  }
  return pending;
}

export function fetchContext(input: {
  word: string;
  sentence: string;
  senses: { partOfSpeech: string; definition: string }[];
}) {
  return post<ContextResponse>("context", input);
}
