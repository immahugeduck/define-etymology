export type ParsedEtymology = { label: string; paragraphs: string[] };
export type ParsedMeaning = { partOfSpeech: string; senses: string[] };

const POS =
  "Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection|Determiner|Article|Numeral|Phrase|Proper_noun|Prefix|Suffix|Particle|Contraction|Proverb|Symbol|Initialism|Abbreviation";

export function extractEnglishHtml(html: string): string {
  const start = html.search(/<h2 id="English"/);
  if (start < 0) return "";
  const rest = html.slice(start);
  const next = rest.slice(80).search(/<h2 id="/);
  return next >= 0 ? rest.slice(0, 80 + next) : rest;
}

export function extractEtymologies(englishHtml: string): ParsedEtymology[] {
  const marks = headingMarks(englishHtml, /<h3 id="(Etymology(?:_\d+)?)">/g);
  return marks
    .map((mark, index) => {
      const slice = sectionSlice(englishHtml, marks, index);
      const paragraphs = [...slice.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
        .map((match) => toText(match[1] ?? ""))
        .filter((text) => text.length > 1);
      const label = mark.id === "Etymology" ? "Etymology" : mark.id.replaceAll("_", " ");
      return { label, paragraphs };
    })
    .filter((block) => block.paragraphs.length > 0)
    .slice(0, 3);
}

export function extractMeanings(englishHtml: string): ParsedMeaning[] {
  return extractRichMeanings(englishHtml).map((meaning) => ({
    partOfSpeech: meaning.partOfSpeech,
    senses: meaning.senses.map((sense) => sense.text),
  }));
}

export type FormOf = { relation: string; lemma: string };
export type ParsedSense = { text: string; example: string | null; formOf: FormOf | null };
export type RichMeaning = { partOfSpeech: string; senses: ParsedSense[] };

/** Like extractMeanings, but keeps usage examples and Wiktionary form-of links. */
export function extractRichMeanings(englishHtml: string): RichMeaning[] {
  const marks = headingMarks(englishHtml, new RegExp(`<h[34] id="((?:${POS})(?:_\\d+)?)">`, "g"));
  const meanings: RichMeaning[] = [];
  for (let index = 0; index < marks.length && meanings.length < 4; index++) {
    const mark = marks[index];
    if (!mark) continue;
    const slice = sectionSlice(englishHtml, marks, index);
    const list = firstOrderedList(slice);
    if (!list) continue;
    const senses = topLevelItems(list)
      .map((item) => parseSense(item))
      .filter((sense) => sense.text.length > 1)
      .slice(0, 4);
    if (senses.length === 0) continue;
    const part = mark.id.replace(/_\d+$/, "").replaceAll("_", " ").toLowerCase();
    meanings.push({ partOfSpeech: part, senses });
  }
  return meanings;
}

export function parseSense(itemHtml: string): ParsedSense {
  const text = toText(removeNestedLists(itemHtml));
  const example = firstExample(itemHtml);
  return { text, example, formOf: htmlFormOf(itemHtml) ?? textFormOf(text) };
}

function htmlFormOf(html: string): FormOf | null {
  const match = html.match(
    /<span class="form-of-definition[^"]*">([\s\S]*?)<span class="form-of-definition-link">[\s\S]*?<a href="\/wiki\/([^"#?]+)#English"/,
  );
  if (!match?.[1] || !match[2]) return null;
  const relation = toText(match[1]).replace(/\s+of\s*$/i, "").trim();
  let lemma = match[2];
  try {
    lemma = decodeURIComponent(lemma);
  } catch {
    /* keep raw */
  }
  lemma = lemma.replace(/_/g, " ").trim();
  if (!relation || !lemma) return null;
  return { relation: capitalize(relation), lemma };
}

const FORM_RELATIONS = [
  "plural",
  "plural form",
  "alternative form",
  "alternative spelling",
  "alternative letter-case form",
  "archaic form",
  "archaic spelling",
  "obsolete form",
  "obsolete spelling",
  "dated form",
  "dated spelling",
  "nonstandard form",
  "nonstandard spelling",
  "eye dialect spelling",
  "informal spelling",
  "misspelling",
  "common misspelling",
  "simple past tense and past participle",
  "simple past and past participle",
  "simple past tense",
  "simple past",
  "past tense",
  "past participle",
  "present participle",
  "present participle and gerund",
  "third-person singular simple present indicative",
  "third-person singular simple present indicative form",
  "third-person singular",
  "comparative form",
  "comparative degree",
  "comparative",
  "superlative form",
  "superlative degree",
  "superlative",
  "inflection",
  "british spelling",
  "american spelling",
  "standard spelling",
  "uk spelling",
  "us spelling",
  "abbreviation",
  "contraction",
  "clipping",
  "diminutive",
];

const FORM_TEXT_RE = new RegExp(
  `^(?:\\([^)]{1,60}\\)\\s*)?((?:${FORM_RELATIONS.join("|")}))\\s+of\\s+["“]?([\\p{L}][\\p{L}\\p{M}'’ -]{0,40}?)["”]?(?=$|[.:;,(]|\\s+and\\s|\\s*$)`,
  "iu",
);

/** Regex fallback for plain-text sources ("plural of diatom", "Alternative form of peneplain."). */
export function textFormOf(text: string): FormOf | null {
  const match = text.trim().match(FORM_TEXT_RE);
  if (!match?.[1] || !match[2]) return null;
  const lemma = match[2].trim();
  if (!lemma) return null;
  return { relation: capitalize(match[1].toLowerCase()), lemma };
}

function firstExample(html: string): string | null {
  for (const cls of ["e-example", "e-quotation"]) {
    const inner = elementWithClass(html, cls);
    if (inner) {
      const text = toText(inner);
      if (text.length > 8) return text.length > 320 ? `${text.slice(0, 300).replace(/\s+\S*$/, "")}…` : text;
    }
  }
  return null;
}

function elementWithClass(html: string, cls: string): string | null {
  const open = new RegExp(`<(\\w+)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, "i").exec(html);
  if (!open || open.index == null || !open[1]) return null;
  const tag = open[1].toLowerCase();
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  re.lastIndex = open.index + open[0].length;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(open.index + open[0].length, match.index);
  }
  return null;
}

/** Split an <ol> body into its top-level <li> contents (nested lists included). */
function topLevelItems(listHtml: string): string[] {
  const items: string[] = [];
  const re = /<\/?li\b[^>]*>/gi;
  let depth = 0;
  let start = -1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(listHtml))) {
    if (match[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        items.push(listHtml.slice(start, match.index));
        start = -1;
      }
    } else {
      if (depth === 0) start = match.index + match[0].length;
      depth += 1;
    }
  }
  if (start >= 0) items.push(listHtml.slice(start));
  return items;
}

function capitalize(value: string): string {
  return value ? value[0]!.toUpperCase() + value.slice(1) : value;
}

export function extractIpa(englishHtml: string): string | null {
  const match = englishHtml.match(/class="[^"]*\bIPA\b[^"]*"[^>]*>([^<]+)</);
  const ipa = match?.[1] ? toText(match[1]) : "";
  return ipa || null;
}

export function extractAudio(englishHtml: string): string | null {
  const urls = [...englishHtml.matchAll(/(?:src|href)="([^"]+\.(?:mp3|ogg|wav))"/gi)].map((match) =>
    absolutize(match[1] ?? ""),
  );
  const mp3 = urls.filter((url) => url.endsWith(".mp3"));
  const pool = mp3.length ? mp3 : urls;
  const us = pool.find((url) => /[-_/]us[-_.]/i.test(url));
  return us || pool[0] || null;
}

function headingMarks(html: string, re: RegExp): { id: string; index: number }[] {
  const marks: { id: string; index: number }[] = [];
  for (const match of html.matchAll(re)) {
    if (match.index == null || !match[1]) continue;
    marks.push({ id: match[1], index: match.index });
  }
  return marks;
}

function sectionSlice(html: string, marks: { index: number }[], index: number): string {
  const start = marks[index]?.index ?? 0;
  const end = marks[index + 1]?.index ?? html.length;
  let slice = html.slice(start, end);
  const nextHead = slice.slice(30).search(/<h[2-6] id="/);
  if (nextHead >= 0) slice = slice.slice(0, 30 + nextHead);
  return slice;
}

function firstOrderedList(html: string): string | null {
  const start = html.search(/<ol\b/i);
  if (start < 0) return null;
  const openEnd = html.indexOf(">", start);
  if (openEnd < 0) return null;
  let depth = 1;
  const re = /<\/?ol\b[^>]*>/gi;
  re.lastIndex = openEnd + 1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(openEnd + 1, match.index);
  }
  return html.slice(openEnd + 1);
}

function removeNestedLists(html: string): string {
  let current = html;
  for (let i = 0; i < 6; i++) {
    const next = current.replace(/<(ul|ol|dl)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
    if (next === current) break;
    current = next;
  }
  return current;
}

function absolutize(src: string): string {
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `https://en.wiktionary.org${src}`;
  return src;
}

function toText(html: string): string {
  const stripped = html
    .replace(/<sup\b[\s\S]*?<\/sup>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(stripped)
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;|'/g, "'")
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(Number(num)))
    .replace(/&#x([0-9a-f]+);/gi, (_, num: string) => String.fromCodePoint(parseInt(num, 16)));
}
