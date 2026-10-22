import {
  MAX_BODY_BYTES,
  MAX_DEFINITION_CHARS,
  MAX_SENSES,
  MAX_SENTENCE_CHARS,
  MAX_WORD_CHARS,
  RATE_LIMITS,
  type AiStatus,
  type ContextResponse,
} from "@/lib/ai/config";
import { checkSameOrigin, clientIp, RateLimiter } from "@/lib/ai/guard.server";
import { aiModelId, generateExample, hasAiKey, inferFromContext } from "@/lib/ai/xai.server";

const limiter = new RateLimiter(RATE_LIMITS);

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

function fail(status: number, error: string, message: string, headers: Record<string, string> = {}) {
  return json({ error, message }, status, headers);
}

export function statusResponse() {
  const available = hasAiKey();
  const body: AiStatus = { available, model: available ? aiModelId() : null };
  return json(body);
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export async function handleAiRequest(request: Request, action: string): Promise<Response> {
  if (action !== "example" && action !== "context") return fail(404, "not_found", "Unknown action.");
  if (!hasAiKey()) return fail(503, "unavailable", "AI features aren't set up on this site.");

  const headers = request.headers;
  const sameOrigin = checkSameOrigin({
    origin: headers.get("origin"),
    referer: headers.get("referer"),
    requestHosts: [headers.get("x-forwarded-host"), headers.get("host"), new URL(request.url).host],
    allowed: [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL],
  });
  if (!sameOrigin) return fail(403, "origin", "Requests must come from Etymon.");

  const declared = Number(headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return fail(413, "too_large", "That request is too large.");
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "too_large", "That request is too large.");
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_request", "Couldn't read that request.");
  }

  const word = clean(body.word, MAX_WORD_CHARS);
  if (!word) return fail(400, "bad_request", "A word is required.");

  const rate = limiter.check(clientIp(headers));
  if (!rate.ok) {
    return fail(429, "rate_limited", `Too many requests. Try again in ${rate.retryAfterSec}s.`, {
      "retry-after": String(rate.retryAfterSec),
    });
  }

  const signal = AbortSignal.timeout(20_000);
  try {
    if (action === "example") {
      const definition = clean(body.definition, MAX_DEFINITION_CHARS);
      if (!definition) return fail(400, "bad_request", "A definition is required.");
      const out = await generateExample(
        { word, partOfSpeech: clean(body.partOfSpeech, 30), definition },
        signal,
      );
      const sentence = clean(out?.sentence, 300);
      if (!sentence) return fail(502, "empty", "Grok didn't return an example.");
      return json({ sentence });
    }

    const sentence = clean(body.sentence, MAX_SENTENCE_CHARS);
    if (sentence.length < 3) return fail(400, "bad_request", "Paste the sentence the word appears in.");
    const senses = (Array.isArray(body.senses) ? body.senses : [])
      .slice(0, MAX_SENSES)
      .map((item) => {
        const sense = (item ?? {}) as Record<string, unknown>;
        return { partOfSpeech: clean(sense.partOfSpeech, 30), definition: clean(sense.definition, MAX_DEFINITION_CHARS) };
      })
      .filter((sense) => sense.definition);
    const out = await inferFromContext({ word, sentence, senses }, signal);
    if (!out?.definition) return fail(502, "empty", "Grok couldn't work out a meaning.");
    const best = typeof out.bestSense === "number" && out.bestSense >= 0 && out.bestSense < senses.length ? out.bestSense : null;
    const response: ContextResponse = {
      word,
      lemma: clean(out.lemma, MAX_WORD_CHARS) || word,
      partOfSpeech: clean(out.partOfSpeech, 30),
      definition: clean(out.definition, 600),
      origin: out.origin ? clean(out.origin, 500) : null,
      bestSense: best,
      confidence: out.confidence,
      note: out.note ? clean(out.note, 300) : null,
    };
    return json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = (error as { statusCode?: number })?.statusCode;
    if (status) console.error("[etymon-ai] provider", status, message.slice(0, 300));
    if (status === 401 || status === 403) return fail(502, "provider_auth", "The AI key was rejected.");
    if (status === 429) return fail(503, "provider_busy", "Grok is busy. Try again in a moment.");
    if (/abort|timeout/i.test(message)) return fail(504, "timeout", "Grok took too long. Try again.");
    console.error("[etymon-ai]", action, message.slice(0, 200));
    return fail(502, "provider_error", "Grok couldn't answer just now.");
  }
}
