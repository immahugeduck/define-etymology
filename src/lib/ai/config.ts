/**
 * Grok (xAI) config shared by the server route and the client. Nothing secret
 * lives here: the key is only read in `xai.server.ts`.
 */

/** Fast non-reasoning Grok. Override server-side with ETYMON_AI_MODEL. */
export const DEFAULT_AI_MODEL = "grok-4.20-non-reasoning";

/** Env var names, in lookup order, that may hold the xAI key. */
export const AI_KEY_ENV_NAMES = ["XAI_API_KEY", "GROK_API_KEY"] as const;

export const MAX_WORD_CHARS = 60;
export const MAX_SENTENCE_CHARS = 600;
export const MAX_DEFINITION_CHARS = 400;
export const MAX_SENSES = 12;
export const MAX_BODY_BYTES = 16 * 1024;

export const MAX_OUTPUT_TOKENS = { example: 120, context: 450 } as const;

export const RATE_LIMITS = { perMinute: 8, perHour: 60, globalPerHour: 600 } as const;

export type AiStatus = { available: boolean; model: string | null };

export type ExampleResponse = { sentence: string };

export type ContextResponse = {
  word: string;
  lemma: string;
  partOfSpeech: string;
  definition: string;
  origin: string | null;
  /** Index into the senses the client sent, or null. */
  bestSense: number | null;
  confidence: "high" | "medium" | "low";
  note: string | null;
};

export type AiError = { error: string; message: string };
