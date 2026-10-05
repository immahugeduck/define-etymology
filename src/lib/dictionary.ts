import { createServerFn } from "@tanstack/react-start";
import {
  extractAudio,
  extractEnglishHtml,
  extractEtymologies,
  extractIpa,
  extractMeanings,
} from "@/lib/wiktionary-parse";

export type Sense = { definition: string; example: string | null };
export type Meaning = { partOfSpeech: string; senses: Sense[] };
export type Etymology = { label: string; paragraphs: string[] };

export type LookupResult =
  | {
      ok: true;
      word: string;
      phonetic: string | null;
      audio: string | null;
      meanings: Meaning[];
      etymologies: Etymology[];
      synonyms: string[];
      antonyms: string[];
      etymologyNote: string | null;
      sourceUrl: string;
    }
  | {
      ok: false;
      word: string;
      reason: "invalid" | "missing" | "busy" | "failed";
    };

const WORD = /^[\p{L}\p{M}][\p{L}\p{M}0-9'’. -]{0,58}$/u;
const TTL_MS = 12 * 60 * 60 * 1000;
const UA = "Etymon/1.0 (educational dictionary; definition and etymology lookup)";

type CacheEntry = { at: number; value: LookupResult };

const lookupCache = new Map<string, CacheEntry>();
const lookupPending = new Map<string, Promise<LookupResult>>();
const suggestCache = new Map<string, { at: number; words: string[] }>();

export const lookupWord = createServerFn({ method: "GET" })
  .validator((input: { word: string }) => ({
    word: typeof input?.word === "string" ? input.word.trim().replace(/\s+/g, " ").slice(0, 60) : "",
  }))
  .handler(async ({ data }): Promise<LookupResult> => lookupEntry(data.word));

export const suggestWords = createServerFn({ method: "GET" })
  .validator((input: { q: string }) => ({
    q: typeof input?.q === "string" ? input.q.trim().toLowerCase().slice(0, 40) : "",
  }))
  .handler(async ({ data }): Promise<string[]> => suggest(data.q));

async function lookupEntry(raw: string): Promise<LookupResult> {
  const word = raw.replace(/’/g, "'");
  if (!word || !WORD.test(word)) return { ok: false, word: raw, reason: "invalid" };

  const key = word.toLowerCase();
  const hit = lookupCache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const inflight = lookupPending.get(key);
  if (inflight) return inflight;

  const pending = computeLookup(word).finally(() => {
    lookupPending.delete(key);
  });
  lookupPending.set(key, pending);
  const value = await pending;
  if (value.ok || value.reason === "missing" || value.reason === "invalid") {
    lookupCache.set(key, { at: Date.now(), value });
    if (lookupCache.size > 120) {
      const oldest = lookupCache.keys().next().value;
      if (oldest) lookupCache.delete(oldest);
    }
  }
  return value;
}

async function computeLookup(word: string): Promise<LookupResult> {
  const [dict, wiki] = await Promise.all([fetchDictionary(word), fetchWiktionary(word)]);

  if (!dict.entry && wiki.kind !== "ok") {
    if (dict.busy || wiki.kind === "busy") return { ok: false, word, reason: "busy" };
    if (dict.missing && wiki.kind === "missing") return { ok: false, word, reason: "missing" };
    return { ok: false, word, reason: "failed" };
  }

  const wikiMeanings = wiki.kind === "ok" ? wiki.meanings : [];
  const meanings = simplifyMeanings(dict.entry?.meanings.length ? dict.entry.meanings : wikiMeanings);
  const etymologies = wiki.kind === "ok" ? simplifyEtymologies(wiki.etymologies) : [];
  if (meanings.length === 0 && etymologies.length === 0) {
    return { ok: false, word, reason: wiki.kind === "busy" || dict.busy ? "busy" : "missing" };
  }

  const display =
    dict.entry?.word || (wiki.kind === "ok" ? wiki.title : "") || word;
  const phonetic = dict.entry?.phonetic || (wiki.kind === "ok" ? wiki.ipa : null);
  const audio = dict.entry?.audio || (wiki.kind === "ok" ? wiki.audio : null);
  const sourceTitle = (wiki.kind === "ok" ? wiki.title : display).replace(/ /g, "_");

  let etymologyNote: string | null = null;
  if (etymologies.length === 0 && wiki.kind === "busy") {
    etymologyNote = "The origin is busy right now. Try this word again in a moment.";
  } else if (etymologies.length === 0) {
    etymologyNote = "No short origin is listed for this word.";
  }

  return {
    ok: true,
    word: display,
    phonetic,
    audio,
    meanings,
    etymologies,
    synonyms: dict.entry?.synonyms ?? [],
    antonyms: dict.entry?.antonyms ?? [],
    etymologyNote,
    sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(sourceTitle)}`,
  };
}

type DictShape = {
  entry: {
    word: string;
    phonetic: string | null;
    audio: string | null;
    meanings: Meaning[];
    synonyms: string[];
    antonyms: string[];
  } | null;
  missing: boolean;
  busy: boolean;
};

async function fetchDictionary(word: string): Promise<DictShape> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const res = await fetchJson(url, 4_000, 0);
  if (!res) return { entry: null, missing: false, busy: false };
  if (res.status === 404) return { entry: null, missing: true, busy: false };
  if (res.status === 429 || res.status === 503) return { entry: null, missing: false, busy: true };
  if (res.status !== 200 || !Array.isArray(res.json)) {
    return { entry: null, missing: false, busy: false };
  }

  const rows = res.json as DictRow[];
  const meanings: Meaning[] = [];
  const synonyms = new Set<string>();
  const antonyms = new Set<string>();
  let phonetic: string | null = null;
  let audio: string | null = null;
  let display = word;

  for (const row of rows) {
    if (typeof row.word === "string" && row.word) display = row.word;
    if (!phonetic && typeof row.phonetic === "string" && row.phonetic) phonetic = row.phonetic;
    for (const item of row.phonetics ?? []) {
      if (!phonetic && item.text) phonetic = item.text;
      if (!audio && item.audio) audio = item.audio;
      if (item.audio?.includes("-us.")) audio = item.audio;
    }
    for (const meaning of row.meanings ?? []) {
      const senses: Sense[] = [];
      for (const sense of meaning.definitions ?? []) {
        if (!sense.definition) continue;
        senses.push({ definition: sense.definition, example: sense.example || null });
        collectWords(synonyms, sense.synonyms);
        collectWords(antonyms, sense.antonyms);
        if (senses.length >= 4) break;
      }
      collectWords(synonyms, meaning.synonyms);
      collectWords(antonyms, meaning.antonyms);
      if (senses.length && meanings.length < 4) {
        meanings.push({ partOfSpeech: meaning.partOfSpeech || "entry", senses });
      }
    }
  }

  const self = display.toLowerCase();
  return {
    entry: {
      word: display,
      phonetic,
      audio,
      meanings,
      synonyms: [...synonyms].filter((item) => item.toLowerCase() !== self).slice(0, 10),
      antonyms: [...antonyms].filter((item) => item.toLowerCase() !== self).slice(0, 6),
    },
    missing: meanings.length === 0,
    busy: false,
  };
}

type DictRow = {
  word?: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] }[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
};

function collectWords(into: Set<string>, words: string[] | undefined) {
  for (const word of words ?? []) {
    const clean = word.trim();
    if (clean && clean.length < 40) into.add(clean);
  }
}

type WikiShape =
  | { kind: "ok"; title: string; etymologies: Etymology[]; meanings: Meaning[]; ipa: string | null; audio: string | null }
  | { kind: "missing" | "busy" | "failed" };

async function fetchWiktionary(word: string): Promise<WikiShape> {
  const params = new URLSearchParams({
    action: "parse",
    page: word,
    prop: "text",
    format: "json",
    redirects: "1",
    disabletoc: "1",
  });
  const res = await fetchJson(`https://en.wiktionary.org/w/api.php?${params}`, 10_000, 1);
  if (!res) return { kind: "failed" };
  if (res.status === 429 || res.status === 503) return { kind: "busy" };
  const body = res.json as {
    parse?: { title?: string; text?: { "*"?: string } };
    error?: { code?: string };
  } | null;
  if (!body || body.error?.code === "missingtitle") return { kind: "missing" };
  const html = body.parse?.text?.["*"];
  if (!html) return res.status === 200 ? { kind: "missing" } : { kind: "failed" };

  const english = extractEnglishHtml(html);
  const etymologies = extractEtymologies(english).map((block) => ({
    label: block.label,
    paragraphs: block.paragraphs.slice(0, 3),
  }));
  const meanings = extractMeanings(english).map((meaning) => ({
    partOfSpeech: meaning.partOfSpeech,
    senses: meaning.senses.map((definition) => ({ definition, example: null })),
  }));
  return {
    kind: "ok",
    title: (body.parse?.title || word).replace(/_/g, " "),
    etymologies,
    meanings,
    ipa: extractIpa(english),
    audio: extractAudio(english),
  };
}

async function suggest(q: string): Promise<string[]> {
  if (q.length < 2 || !WORD.test(q)) return [];
  const hit = suggestCache.get(q);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.words;

  const res = await fetchJson(`https://api.datamuse.com/sug?s=${encodeURIComponent(q)}&max=8`, 4_000, 0);
  const rows = Array.isArray(res?.json) ? (res.json as { word?: string }[]) : [];
  const words = rows
    .map((row) => row.word?.trim() ?? "")
    .filter((word) => WORD.test(word))
    .slice(0, 7);
  suggestCache.set(q, { at: Date.now(), words });
  return words;
}

async function fetchJson(
  url: string,
  timeoutMs = 8_000,
  retries = 1,
): Promise<{ status: number; json: unknown } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": UA },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if ((res.status === 429 || res.status === 503) && attempt < retries) {
        await delay(800);
        continue;
      }
      const json = await res.json().catch(() => null);
      return { status: res.status, json };
    } catch {
      if (attempt < retries) {
        await delay(400);
        continue;
      }
      return null;
    }
  }
  return null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simplifyMeanings(meanings: Meaning[]): Meaning[] {
  const groups = new Map<string, Sense[]>();
  for (const meaning of meanings) {
    const key = meaning.partOfSpeech.toLowerCase();
    const list = groups.get(key) ?? [];
    for (const sense of meaning.senses) {
      const definition = tidySense(sense.definition);
      if (definition.length < 2) continue;
      if (list.some((item) => item.definition === definition)) continue;
      list.push({ definition, example: sense.example });
    }
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([partOfSpeech, senses]) => {
      const ranked = [...senses].sort((a, b) => nicheScore(a.definition) - nicheScore(b.definition));
      const common = ranked.filter((sense) => nicheScore(sense.definition) === 0);
      return {
        partOfSpeech,
        senses: (common.length > 0 ? common : ranked).slice(0, 3),
      };
    })
    .filter((meaning) => meaning.senses.length > 0)
    .slice(0, 3);
}

function simplifyEtymologies(blocks: Etymology[]): Etymology[] {
  const niche = (block: Etymology) =>
    block.paragraphs.some((paragraph) => /\b(slang|4chan|usenet|imageboard)\b/i.test(paragraph));
  const primary = blocks.filter((block) => !niche(block));
  return (primary.length > 0 ? primary : blocks)
    .map((block) => ({
      label: block.label,
      paragraphs: block.paragraphs.map(polishParagraph).filter((paragraph) => paragraph.length > 0).slice(0, 1),
    }))
    .filter((block) => block.paragraphs.length > 0)
    .slice(0, 2);
}

function polishParagraph(paragraph: string): string {
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1 && !/^see\s+[\p{L}'’-]+\.?$/iu.test(sentence));
  const kept: string[] = [];
  for (const sentence of sentences) {
    if (kept.length === 2) break;
    if (sentence.length > 280) {
      const cut = sentence.slice(0, 260).replace(/\s+\S*$/, "").trim();
      kept.push(cut ? `${cut}…` : sentence.slice(0, 260));
      break;
    }
    kept.push(sentence);
  }
  return kept.join(" ");
}

function tidySense(definition: string): string {
  return definition
    .replace(/\s*\[[^\]]{0,80}\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nicheScore(definition: string): number {
  let score = 0;
  if (/\b(obsolete|archaic|historical|dated|rare)\b/i.test(definition)) score += 2;
  if (/\b(slang|4chan|vulgar|offensive|internet)\b/i.test(definition)) score += 3;
  return score;
}
