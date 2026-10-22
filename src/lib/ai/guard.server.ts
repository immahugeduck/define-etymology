/**
 * Request guards for the Grok endpoints. Etymon has no sign-in, so these
 * are the only things standing between the public URL and the API key:
 * same-origin check, optional passcode, per-IP rate limit. Pure / in-memory —
 * unit-tested in src/lib/lemma.test.ts.
 */

export type HeaderReader = { get(name: string): string | null };

export function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0"
  );
}

/** "https://a.b:8080/x" → "a.b:8080"; bare hosts pass through lowercased. */
export function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  if (!text || text === "null") return null;
  try {
    return new URL(text.includes("://") ? text : `https://${text}`).host.toLowerCase();
  } catch {
    return null;
  }
}

function hostnameOf(host: string) {
  return host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
}

export type OriginCheckInput = {
  origin: string | null;
  referer: string | null;
  /** Host / X-Forwarded-Host of this request. */
  requestHosts: (string | null | undefined)[];
  /** Extra allowed hosts or origins (deployment URLs, env allow-list). */
  allowed?: (string | null | undefined)[];
};

/**
 * Same-origin guard: the browser's Origin (or, failing that, Referer) must
 * name this deployment's host, a configured allowed host, or — only when the
 * request itself is local — localhost. Requests with neither header fail.
 */
export function checkSameOrigin(input: OriginCheckInput): boolean {
  const source = hostOf(input.origin) ?? hostOf(input.referer);
  if (!source) return false;
  const requestHosts = input.requestHosts
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => hostOf(value))
    .filter((value): value is string => Boolean(value));
  const allowed = new Set<string>([
    ...requestHosts,
    ...(input.allowed ?? []).map((value) => hostOf(value)).filter((v): v is string => Boolean(v)),
  ]);
  if (allowed.has(source)) return true;
  const sourceName = hostnameOf(source);
  if (isLocalHostname(sourceName)) {
    return requestHosts.some((host) => isLocalHostname(hostnameOf(host)));
  }
  // Allowed entries without a port match any port on that hostname.
  for (const entry of allowed) {
    if (!/:\d+$/.test(entry) && entry === sourceName) return true;
  }
  return false;
}

/** Best client IP from proxy headers (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(headers: HeaderReader): string {
  const forwarded =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Constant-time string comparison for the optional passcode. */
export function passcodeMatches(expected: string, provided: string | null | undefined): boolean {
  const a = expected;
  const b = provided ?? "";
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0 && a.length > 0;
}

export type RateLimits = { perMinute: number; perHour: number; globalPerHour: number };
export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const MAX_TRACKED_KEYS = 5_000;

/**
 * Sliding-window limiter kept in memory. Best-effort only: each serverless
 * instance has its own map, and a cold start resets it.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private global: number[] = [];

  constructor(
    private readonly limits: RateLimits,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateResult {
    const now = this.now();
    this.global = this.global.filter((t) => now - t < HOUR);
    if (this.global.length >= this.limits.globalPerHour) {
      return { ok: false, retryAfterSec: Math.ceil((HOUR - (now - this.global[0]!)) / 1000) };
    }
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < HOUR);
    const lastMinute = recent.filter((t) => now - t < MINUTE);
    if (lastMinute.length >= this.limits.perMinute) {
      this.hits.set(key, recent);
      return { ok: false, retryAfterSec: Math.ceil((MINUTE - (now - lastMinute[0]!)) / 1000) };
    }
    if (recent.length >= this.limits.perHour) {
      this.hits.set(key, recent);
      return { ok: false, retryAfterSec: Math.ceil((HOUR - (now - recent[0]!)) / 1000) };
    }
    recent.push(now);
    this.global.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > MAX_TRACKED_KEYS) this.prune(now);
    return { ok: true };
  }

  private prune(now: number) {
    for (const [key, times] of this.hits) {
      if (!times.some((t) => now - t < HOUR)) this.hits.delete(key);
    }
    if (this.hits.size > MAX_TRACKED_KEYS) this.hits.clear();
  }
}
