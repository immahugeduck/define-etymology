import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dictionary-DLRJlE3E.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var POS = "Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection|Determiner|Article|Numeral|Phrase|Proper_noun|Prefix|Suffix|Particle|Contraction|Proverb|Symbol|Initialism|Abbreviation";
function extractEnglishHtml(html) {
	const start = html.search(/<h2 id="English"/);
	if (start < 0) return "";
	const rest = html.slice(start);
	const next = rest.slice(80).search(/<h2 id="/);
	return next >= 0 ? rest.slice(0, 80 + next) : rest;
}
function extractEtymologies(englishHtml) {
	const marks = headingMarks(englishHtml, /<h3 id="(Etymology(?:_\d+)?)">/g);
	return marks.map((mark, index) => {
		const paragraphs = [...sectionSlice(englishHtml, marks, index).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((match) => toText(match[1] ?? "")).filter((text) => text.length > 1);
		return {
			label: mark.id === "Etymology" ? "Etymology" : mark.id.replaceAll("_", " "),
			paragraphs
		};
	}).filter((block) => block.paragraphs.length > 0).slice(0, 3);
}
function extractMeanings(englishHtml) {
	const marks = headingMarks(englishHtml, new RegExp(`<h[34] id="((?:${POS})(?:_\\d+)?)">`, "g"));
	const meanings = [];
	for (let index = 0; index < marks.length && meanings.length < 4; index++) {
		const mark = marks[index];
		if (!mark) continue;
		const list = firstOrderedList(sectionSlice(englishHtml, marks, index));
		if (!list) continue;
		const senses = [...removeNestedLists(list).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => toText(match[1] ?? "")).filter((text) => text.length > 1).slice(0, 4);
		if (senses.length === 0) continue;
		const part = mark.id.replace(/_\d+$/, "").replaceAll("_", " ").toLowerCase();
		meanings.push({
			partOfSpeech: part,
			senses
		});
	}
	return meanings;
}
function extractIpa(englishHtml) {
	const match = englishHtml.match(/class="[^"]*\bIPA\b[^"]*"[^>]*>([^<]+)</);
	return (match?.[1] ? toText(match[1]) : "") || null;
}
function extractAudio(englishHtml) {
	const urls = [...englishHtml.matchAll(/(?:src|href)="([^"]+\.(?:mp3|ogg|wav))"/gi)].map((match) => absolutize(match[1] ?? ""));
	const mp3 = urls.filter((url) => url.endsWith(".mp3"));
	const pool = mp3.length ? mp3 : urls;
	return pool.find((url) => /[-_/]us[-_.]/i.test(url)) || pool[0] || null;
}
function headingMarks(html, re) {
	const marks = [];
	for (const match of html.matchAll(re)) {
		if (match.index == null || !match[1]) continue;
		marks.push({
			id: match[1],
			index: match.index
		});
	}
	return marks;
}
function sectionSlice(html, marks, index) {
	const start = marks[index]?.index ?? 0;
	const end = marks[index + 1]?.index ?? html.length;
	let slice = html.slice(start, end);
	const nextHead = slice.slice(30).search(/<h[2-6] id="/);
	if (nextHead >= 0) slice = slice.slice(0, 30 + nextHead);
	return slice;
}
function firstOrderedList(html) {
	const start = html.search(/<ol\b/i);
	if (start < 0) return null;
	const openEnd = html.indexOf(">", start);
	if (openEnd < 0) return null;
	let depth = 1;
	const re = /<\/?ol\b[^>]*>/gi;
	re.lastIndex = openEnd + 1;
	let match;
	while (match = re.exec(html)) {
		depth += match[0].startsWith("</") ? -1 : 1;
		if (depth === 0) return html.slice(openEnd + 1, match.index);
	}
	return html.slice(openEnd + 1);
}
function removeNestedLists(html) {
	let current = html;
	for (let i = 0; i < 6; i++) {
		const next = current.replace(/<(ul|ol|dl)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
		if (next === current) break;
		current = next;
	}
	return current;
}
function absolutize(src) {
	if (src.startsWith("//")) return `https:${src}`;
	if (src.startsWith("/")) return `https://en.wiktionary.org${src}`;
	return src;
}
function toText(html) {
	return decodeEntities(html.replace(/<sup\b[\s\S]*?<\/sup>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")).replace(/[\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g, "").replace(/\s+/g, " ").trim();
}
function decodeEntities(value) {
	return value.replace(/&nbsp;/g, " ").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/&#39;|'/g, "'").replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num))).replace(/&#x([0-9a-f]+);/gi, (_, num) => String.fromCodePoint(parseInt(num, 16)));
}
var WORD = /^[\p{L}\p{M}][\p{L}\p{M}0-9'’. -]{0,58}$/u;
var TTL_MS = 432e5;
var UA = "Etymon/1.0 (educational dictionary; definition and etymology lookup)";
var lookupCache = /* @__PURE__ */ new Map();
var lookupPending = /* @__PURE__ */ new Map();
var suggestCache = /* @__PURE__ */ new Map();
var lookupWord_createServerFn_handler = createServerRpc({
	id: "87c1151815e2ba87b2c4d522dadd57d097626e97baa0f7071b62e3a89f87e15e",
	name: "lookupWord",
	filename: "src/lib/dictionary.ts"
}, (opts) => lookupWord.__executeServer(opts));
var lookupWord = createServerFn({ method: "GET" }).validator((input) => ({ word: typeof input?.word === "string" ? input.word.trim().replace(/\s+/g, " ").slice(0, 60) : "" })).handler(lookupWord_createServerFn_handler, async ({ data }) => lookupEntry(data.word));
var suggestWords_createServerFn_handler = createServerRpc({
	id: "7fc019f377d69cda7c055c981ad0e9fe3dd5addb1ccfc5bc9e13ca5e5700090d",
	name: "suggestWords",
	filename: "src/lib/dictionary.ts"
}, (opts) => suggestWords.__executeServer(opts));
var suggestWords = createServerFn({ method: "GET" }).validator((input) => ({ q: typeof input?.q === "string" ? input.q.trim().toLowerCase().slice(0, 40) : "" })).handler(suggestWords_createServerFn_handler, async ({ data }) => suggest(data.q));
async function lookupEntry(raw) {
	const word = raw.replace(/’/g, "'");
	if (!word || !WORD.test(word)) return {
		ok: false,
		word: raw,
		reason: "invalid"
	};
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
		lookupCache.set(key, {
			at: Date.now(),
			value
		});
		if (lookupCache.size > 120) {
			const oldest = lookupCache.keys().next().value;
			if (oldest) lookupCache.delete(oldest);
		}
	}
	return value;
}
async function computeLookup(word) {
	const [dict, wiki] = await Promise.all([fetchDictionary(word), fetchWiktionary(word)]);
	if (!dict.entry && wiki.kind !== "ok") {
		if (dict.busy || wiki.kind === "busy") return {
			ok: false,
			word,
			reason: "busy"
		};
		if (dict.missing && wiki.kind === "missing") return {
			ok: false,
			word,
			reason: "missing"
		};
		return {
			ok: false,
			word,
			reason: "failed"
		};
	}
	const wikiMeanings = wiki.kind === "ok" ? wiki.meanings : [];
	const meanings = simplifyMeanings(dict.entry?.meanings.length ? dict.entry.meanings : wikiMeanings);
	const etymologies = wiki.kind === "ok" ? simplifyEtymologies(wiki.etymologies) : [];
	if (meanings.length === 0 && etymologies.length === 0) return {
		ok: false,
		word,
		reason: wiki.kind === "busy" || dict.busy ? "busy" : "missing"
	};
	const display = dict.entry?.word || (wiki.kind === "ok" ? wiki.title : "") || word;
	const phonetic = dict.entry?.phonetic || (wiki.kind === "ok" ? wiki.ipa : null);
	const audio = dict.entry?.audio || (wiki.kind === "ok" ? wiki.audio : null);
	const sourceTitle = (wiki.kind === "ok" ? wiki.title : display).replace(/ /g, "_");
	let etymologyNote = null;
	if (etymologies.length === 0 && wiki.kind === "busy") etymologyNote = "The origin is busy right now. Try this word again in a moment.";
	else if (etymologies.length === 0) etymologyNote = "No short origin is listed for this word.";
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
		sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(sourceTitle)}`
	};
}
async function fetchDictionary(word) {
	const res = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, 4e3, 0);
	if (!res) return {
		entry: null,
		missing: false,
		busy: false
	};
	if (res.status === 404) return {
		entry: null,
		missing: true,
		busy: false
	};
	if (res.status === 429 || res.status === 503) return {
		entry: null,
		missing: false,
		busy: true
	};
	if (res.status !== 200 || !Array.isArray(res.json)) return {
		entry: null,
		missing: false,
		busy: false
	};
	const rows = res.json;
	const meanings = [];
	const synonyms = /* @__PURE__ */ new Set();
	const antonyms = /* @__PURE__ */ new Set();
	let phonetic = null;
	let audio = null;
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
			const senses = [];
			for (const sense of meaning.definitions ?? []) {
				if (!sense.definition) continue;
				senses.push({
					definition: sense.definition,
					example: sense.example || null
				});
				collectWords(synonyms, sense.synonyms);
				collectWords(antonyms, sense.antonyms);
				if (senses.length >= 4) break;
			}
			collectWords(synonyms, meaning.synonyms);
			collectWords(antonyms, meaning.antonyms);
			if (senses.length && meanings.length < 4) meanings.push({
				partOfSpeech: meaning.partOfSpeech || "entry",
				senses
			});
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
			antonyms: [...antonyms].filter((item) => item.toLowerCase() !== self).slice(0, 6)
		},
		missing: meanings.length === 0,
		busy: false
	};
}
function collectWords(into, words) {
	for (const word of words ?? []) {
		const clean = word.trim();
		if (clean && clean.length < 40) into.add(clean);
	}
}
async function fetchWiktionary(word) {
	const res = await fetchJson(`https://en.wiktionary.org/w/api.php?${new URLSearchParams({
		action: "parse",
		page: word,
		prop: "text",
		format: "json",
		redirects: "1",
		disabletoc: "1"
	})}`, 1e4, 1);
	if (!res) return { kind: "failed" };
	if (res.status === 429 || res.status === 503) return { kind: "busy" };
	const body = res.json;
	if (!body || body.error?.code === "missingtitle") return { kind: "missing" };
	const html = body.parse?.text?.["*"];
	if (!html) return res.status === 200 ? { kind: "missing" } : { kind: "failed" };
	const english = extractEnglishHtml(html);
	const etymologies = extractEtymologies(english).map((block) => ({
		label: block.label,
		paragraphs: block.paragraphs.slice(0, 3)
	}));
	const meanings = extractMeanings(english).map((meaning) => ({
		partOfSpeech: meaning.partOfSpeech,
		senses: meaning.senses.map((definition) => ({
			definition,
			example: null
		}))
	}));
	return {
		kind: "ok",
		title: (body.parse?.title || word).replace(/_/g, " "),
		etymologies,
		meanings,
		ipa: extractIpa(english),
		audio: extractAudio(english)
	};
}
async function suggest(q) {
	if (q.length < 2 || !WORD.test(q)) return [];
	const hit = suggestCache.get(q);
	if (hit && Date.now() - hit.at < 6e5) return hit.words;
	const res = await fetchJson(`https://api.datamuse.com/sug?s=${encodeURIComponent(q)}&max=8`, 4e3, 0);
	const words = (Array.isArray(res?.json) ? res.json : []).map((row) => row.word?.trim() ?? "").filter((word) => WORD.test(word)).slice(0, 7);
	suggestCache.set(q, {
		at: Date.now(),
		words
	});
	return words;
}
async function fetchJson(url, timeoutMs = 8e3, retries = 1) {
	for (let attempt = 0; attempt <= retries; attempt++) try {
		const res = await fetch(url, {
			headers: {
				accept: "application/json",
				"user-agent": UA
			},
			signal: AbortSignal.timeout(timeoutMs)
		});
		if ((res.status === 429 || res.status === 503) && attempt < retries) {
			await delay(800);
			continue;
		}
		const json = await res.json().catch(() => null);
		return {
			status: res.status,
			json
		};
	} catch {
		if (attempt < retries) {
			await delay(400);
			continue;
		}
		return null;
	}
	return null;
}
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function simplifyMeanings(meanings) {
	const groups = /* @__PURE__ */ new Map();
	for (const meaning of meanings) {
		const key = meaning.partOfSpeech.toLowerCase();
		const list = groups.get(key) ?? [];
		for (const sense of meaning.senses) {
			const definition = tidySense(sense.definition);
			if (definition.length < 2) continue;
			if (list.some((item) => item.definition === definition)) continue;
			list.push({
				definition,
				example: sense.example
			});
		}
		groups.set(key, list);
	}
	return [...groups.entries()].map(([partOfSpeech, senses]) => {
		const ranked = [...senses].sort((a, b) => nicheScore(a.definition) - nicheScore(b.definition));
		const common = ranked.filter((sense) => nicheScore(sense.definition) === 0);
		return {
			partOfSpeech,
			senses: (common.length > 0 ? common : ranked).slice(0, 3)
		};
	}).filter((meaning) => meaning.senses.length > 0).slice(0, 3);
}
function simplifyEtymologies(blocks) {
	const niche = (block) => block.paragraphs.some((paragraph) => /\b(slang|4chan|usenet|imageboard)\b/i.test(paragraph));
	const primary = blocks.filter((block) => !niche(block));
	return (primary.length > 0 ? primary : blocks).map((block) => ({
		label: block.label,
		paragraphs: block.paragraphs.map(polishParagraph).filter((paragraph) => paragraph.length > 0).slice(0, 1)
	})).filter((block) => block.paragraphs.length > 0).slice(0, 2);
}
function polishParagraph(paragraph) {
	const sentences = paragraph.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 1 && !/^see\s+[\p{L}'’-]+\.?$/iu.test(sentence));
	const kept = [];
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
function tidySense(definition) {
	return definition.replace(/\s*\[[^\]]{0,80}\]\s*/g, " ").replace(/\s+/g, " ").trim();
}
function nicheScore(definition) {
	let score = 0;
	if (/\b(obsolete|archaic|historical|dated|rare)\b/i.test(definition)) score += 2;
	if (/\b(slang|4chan|vulgar|offensive|internet)\b/i.test(definition)) score += 3;
	return score;
}
//#endregion
export { lookupWord_createServerFn_handler, suggestWords_createServerFn_handler };
