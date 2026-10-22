import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dictionary-CxIY2EON.js
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
/** Like extractMeanings, but keeps usage examples and Wiktionary form-of links. */
function extractRichMeanings(englishHtml) {
	const marks = headingMarks(englishHtml, new RegExp(`<h[34] id="((?:${POS})(?:_\\d+)?)">`, "g"));
	const meanings = [];
	for (let index = 0; index < marks.length && meanings.length < 4; index++) {
		const mark = marks[index];
		if (!mark) continue;
		const list = firstOrderedList(sectionSlice(englishHtml, marks, index));
		if (!list) continue;
		const senses = topLevelItems(list).map((item) => parseSense(item)).filter((sense) => sense.text.length > 1).slice(0, 4);
		if (senses.length === 0) continue;
		const part = mark.id.replace(/_\d+$/, "").replaceAll("_", " ").toLowerCase();
		meanings.push({
			partOfSpeech: part,
			senses
		});
	}
	return meanings;
}
function parseSense(itemHtml) {
	const text = toText(removeNestedLists(itemHtml));
	return {
		text,
		example: firstExample(itemHtml),
		formOf: htmlFormOf(itemHtml) ?? textFormOf(text)
	};
}
function htmlFormOf(html) {
	const match = html.match(/<span class="form-of-definition[^"]*">([\s\S]*?)<span class="form-of-definition-link">[\s\S]*?<a href="\/wiki\/([^"#?]+)#English"/);
	if (!match?.[1] || !match[2]) return null;
	const relation = toText(match[1]).replace(/\s+of\s*$/i, "").trim();
	let lemma = match[2];
	try {
		lemma = decodeURIComponent(lemma);
	} catch {}
	lemma = lemma.replace(/_/g, " ").trim();
	if (!relation || !lemma) return null;
	return {
		relation: capitalize(relation),
		lemma
	};
}
var FORM_TEXT_RE = new RegExp(`^(?:\\([^)]{1,60}\\)\\s*)?((?:${[
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
	"diminutive"
].join("|")}))\\s+of\\s+["“]?([\\p{L}][\\p{L}\\p{M}'’ -]{0,40}?)["”]?(?=$|[.:;,(]|\\s+and\\s|\\s*$)`, "iu");
/** Regex fallback for plain-text sources ("plural of diatom", "Alternative form of peneplain."). */
function textFormOf(text) {
	const match = text.trim().match(FORM_TEXT_RE);
	if (!match?.[1] || !match[2]) return null;
	const lemma = match[2].trim();
	if (!lemma) return null;
	return {
		relation: capitalize(match[1].toLowerCase()),
		lemma
	};
}
function firstExample(html) {
	for (const cls of ["e-example", "e-quotation"]) {
		const inner = elementWithClass(html, cls);
		if (inner) {
			const text = toText(inner);
			if (text.length > 8) return text.length > 320 ? `${text.slice(0, 300).replace(/\s+\S*$/, "")}…` : text;
		}
	}
	return null;
}
function elementWithClass(html, cls) {
	const open = new RegExp(`<(\\w+)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, "i").exec(html);
	if (!open || open.index == null || !open[1]) return null;
	const tag = open[1].toLowerCase();
	const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
	re.lastIndex = open.index + open[0].length;
	let depth = 1;
	let match;
	while (match = re.exec(html)) {
		depth += match[0].startsWith("</") ? -1 : 1;
		if (depth === 0) return html.slice(open.index + open[0].length, match.index);
	}
	return null;
}
/** Split an <ol> body into its top-level <li> contents (nested lists included). */
function topLevelItems(listHtml) {
	const items = [];
	const re = /<\/?li\b[^>]*>/gi;
	let depth = 0;
	let start = -1;
	let match;
	while (match = re.exec(listHtml)) if (match[0].startsWith("</")) {
		depth -= 1;
		if (depth === 0 && start >= 0) {
			items.push(listHtml.slice(start, match.index));
			start = -1;
		}
	} else {
		if (depth === 0) start = match.index + match[0].length;
		depth += 1;
	}
	if (start >= 0) items.push(listHtml.slice(start));
	return items;
}
function capitalize(value) {
	return value ? value[0].toUpperCase() + value.slice(1) : value;
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
/**
* Form-of detection: decides when a looked-up word is really an inflection or
* variant ("plural of diatom", "Alternative form of peneplain") whose real
* definition lives on another entry (the lemma). Pure — unit-tested in
* src/lib/lemma.test.ts.
*/
/** The form-of a sense carries — structured (Wiktionary) first, else by text. */
function senseFormOf(sense) {
	return sense.formOf ?? textFormOf(sense.definition);
}
/**
* Pick the lemma to follow, or null when the word is its own root.
* Follows when the leading sense is a form-of, or when at least half the
* senses are form-ofs (e.g. "ran": simple past of run).
*/
function pickFormOf(word, meanings) {
	const self = normalize(word);
	const senses = meanings.flatMap((meaning) => meaning.senses);
	if (senses.length === 0) return null;
	const forms = senses.map((sense) => senseFormOf(sense)).filter((form) => Boolean(form) && normalize(form.lemma) !== self);
	if (forms.length === 0) return null;
	const lead = meanings[0]?.senses[0];
	const leadForm = lead ? senseFormOf(lead) : null;
	if (leadForm && normalize(leadForm.lemma) !== self) return leadForm;
	if (forms.length * 2 >= senses.length) {
		const counts = /* @__PURE__ */ new Map();
		for (const form of forms) counts.set(normalize(form.lemma), (counts.get(normalize(form.lemma)) ?? 0) + 1);
		const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
		return forms.find((form) => normalize(form.lemma) === best) ?? forms[0];
	}
	return null;
}
/** Drop the senses that just point at `lemma`; keep the word's own senses. */
function ownSenses(meanings, lemma) {
	const target = normalize(lemma);
	return meanings.map((meaning) => ({
		...meaning,
		senses: meaning.senses.filter((sense) => {
			const form = senseFormOf(sense);
			return !form || normalize(form.lemma) !== target;
		})
	})).filter((meaning) => meaning.senses.length > 0);
}
/** "Plural" + "diatom" → "Plural of diatom". */
function formOfLabel(form) {
	const relation = form.relation.trim();
	return `${relation[0]?.toUpperCase() ?? ""}${relation.slice(1)} of ${form.lemma}`;
}
function normalize(value) {
	return value.trim().toLowerCase().replace(/’/g, "'");
}
var WORD = /^[\p{L}\p{M}][\p{L}\p{M}0-9'’. -]{0,58}$/u;
var TTL_MS = 432e5;
var UA = "Etymon/1.1 (https://define-etymology.vercel.app; educational dictionary; github.com/immahugeduck/define-etymology)";
var lookupCache = /* @__PURE__ */ new Map();
var lookupPending = /* @__PURE__ */ new Map();
var suggestCache = /* @__PURE__ */ new Map();
var lookupWord_createServerFn_handler = createServerRpc({
	id: "87c1151815e2ba87b2c4d522dadd57d097626e97baa0f7071b62e3a89f87e15e",
	name: "lookupWord",
	filename: "src/lib/dictionary.ts"
}, (opts) => lookupWord.__executeServer(opts));
var lookupWord = createServerFn({ method: "GET" }).validator((input) => ({ word: typeof input?.word === "string" ? input.word.trim().replace(/\s+/g, " ").slice(0, 60) : "" })).handler(lookupWord_createServerFn_handler, async ({ data }) => lookupEntry(data.word));
var didYouMean_createServerFn_handler = createServerRpc({
	id: "c0559bd956af45bf8852949424d136cf6b7db927ae35ee03e13ae483dcefcfb5",
	name: "didYouMean",
	filename: "src/lib/dictionary.ts"
}, (opts) => didYouMean.__executeServer(opts));
var didYouMean = createServerFn({ method: "GET" }).validator((input) => ({ word: typeof input?.word === "string" ? input.word.trim().slice(0, 60) : "" })).handler(didYouMean_createServerFn_handler, async ({ data }) => spellingSuggestions(data.word));
var suggestWords_createServerFn_handler = createServerRpc({
	id: "7fc019f377d69cda7c055c981ad0e9fe3dd5addb1ccfc5bc9e13ca5e5700090d",
	name: "suggestWords",
	filename: "src/lib/dictionary.ts"
}, (opts) => suggestWords.__executeServer(opts));
var suggestWords = createServerFn({ method: "GET" }).validator((input) => ({ q: typeof input?.q === "string" ? input.q.trim().toLowerCase().slice(0, 40) : "" })).handler(suggestWords_createServerFn_handler, async ({ data }) => suggest(data.q));
async function lookupEntry(raw, depth = 0) {
	const word = raw.replace(/’/g, "'");
	if (!word || !WORD.test(word)) return {
		ok: false,
		word: raw,
		reason: "invalid",
		suggestions: []
	};
	const key = `${depth}:${word.toLowerCase()}`;
	const hit = lookupCache.get(key);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
	const inflight = lookupPending.get(key);
	if (inflight) return inflight;
	const pending = computeLookup(word, depth).finally(() => {
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
async function computeLookup(word, depth) {
	const [dict, wiki, thesaurus] = await Promise.all([
		fetchDictionary(word),
		fetchWiktionary(word),
		fetchThesaurus(word)
	]);
	if (!dict.entry && wiki.kind !== "ok") {
		if (wiki.kind === "missing" && (dict.missing || !dict.busy)) return {
			ok: false,
			word,
			reason: "missing",
			suggestions: depth === 0 ? await spellingSuggestions(word) : []
		};
		if (dict.busy || wiki.kind === "busy") return {
			ok: false,
			word,
			reason: "busy",
			suggestions: []
		};
		return {
			ok: false,
			word,
			reason: "failed",
			suggestions: []
		};
	}
	const wikiMeanings = wiki.kind === "ok" ? wiki.meanings : [];
	const dictMeanings = dict.entry?.meanings ?? [];
	const form = pickFormOf(word, wikiMeanings) ?? pickFormOf(word, dictMeanings);
	const baseMeanings = dictMeanings.length && !(form && !pickFormOf(word, dictMeanings) && wikiMeanings.length) ? dictMeanings : wikiMeanings.length ? wikiMeanings : dictMeanings;
	let root = null;
	if (form && depth === 0) {
		const lemma = await lookupEntry(form.lemma, 1);
		if (lemma.ok && lemma.meanings.length > 0) root = {
			word: lemma.word,
			phonetic: lemma.phonetic,
			meanings: lemma.meanings,
			etymologies: lemma.etymologies,
			etymologySource: lemma.etymologySource,
			sourceUrl: lemma.sourceUrl,
			example: lemma.example
		};
	}
	const meanings = simplifyMeanings(root && form ? ownSenses(baseMeanings, form.lemma) : baseMeanings);
	const ownEtymologies = simplifyEtymologies(dict.entry?.etymologies.length ? dict.entry.etymologies : wiki.kind === "ok" ? wiki.etymologies : []);
	if (meanings.length === 0 && ownEtymologies.length === 0 && !root) {
		const busy = wiki.kind === "busy" || dict.busy;
		return {
			ok: false,
			word,
			reason: busy ? "busy" : "missing",
			suggestions: busy || depth > 0 ? [] : await spellingSuggestions(word)
		};
	}
	const candidate = dict.entry?.word || (wiki.kind === "ok" ? wiki.title : "") || word;
	const display = candidate.toLowerCase() === word.toLowerCase() ? candidate : word;
	const phonetic = dict.entry?.phonetic || (wiki.kind === "ok" ? wiki.ipa : null);
	const audio = dict.entry?.audio || (wiki.kind === "ok" ? wiki.audio : null);
	const sourceTitle = (wiki.kind === "ok" ? wiki.title : display).replace(/ /g, "_");
	const useRootOrigin = ownEtymologies.length === 0 && Boolean(root?.etymologies.length);
	const etymologies = useRootOrigin && root ? root.etymologies : ownEtymologies;
	let etymologyNote = null;
	if (etymologies.length === 0 && wiki.kind === "busy") etymologyNote = "The origin is busy right now. Try this word again in a moment.";
	else if (etymologies.length === 0) etymologyNote = "No short origin is listed for this word.";
	else if (useRootOrigin && root) etymologyNote = `From the root word, ${root.word}.`;
	const ownEtymologySource = dict.entry?.etymologies.length ? "Merriam-Webster" : wiki.kind === "ok" && wiki.etymologies.length ? "Wiktionary" : "not available";
	const ownSourceUrl = dict.entry?.etymologies.length ? `https://www.merriam-webster.com/dictionary/${encodeURIComponent(display)}` : `https://en.wiktionary.org/wiki/${encodeURIComponent(sourceTitle)}`;
	const example = pickExample([
		{
			meanings,
			source: dict.entry?.source ?? "Wiktionary"
		},
		{
			meanings: wikiMeanings,
			source: "Wiktionary"
		},
		{
			meanings: root?.meanings ?? [],
			source: root ? `Wiktionary (${root.word})` : "Wiktionary"
		}
	]) ?? (root?.example ? {
		text: root.example.text,
		source: `${root.example.source} (${root.word})`
	} : null);
	let synonyms = thesaurus.synonyms.length ? thesaurus.synonyms : dict.entry?.synonyms ?? [];
	let thesaurusSource = thesaurus.available ? "Merriam-Webster" : dict.entry?.synonyms.length || dict.entry?.antonyms.length ? dict.entry.source : "not available";
	let rhymes = [];
	if (depth === 0) {
		const related = await fetchDatamuseRelated(display, display);
		if (root) {
			const rootRelated = await fetchDatamuseRelated(root.word, display);
			if (rootRelated.rhymes.length) related.rhymes = rootRelated.rhymes;
		}
		if (synonyms.length === 0 && related.synonyms.length) {
			synonyms = related.synonyms;
			thesaurusSource = "Datamuse";
		}
		rhymes = related.rhymes;
	}
	return {
		ok: true,
		word: display,
		phonetic: phonetic || root?.phonetic || null,
		audio,
		meanings,
		etymologies,
		synonyms,
		antonyms: thesaurus.antonyms.length ? thesaurus.antonyms : dict.entry?.antonyms ?? [],
		dictionarySource: dict.entry?.source ?? "Wiktionary",
		thesaurusSource,
		etymologySource: useRootOrigin && root ? root.etymologySource : ownEtymologySource,
		etymologyNote,
		sourceUrl: useRootOrigin && root ? root.sourceUrl : ownSourceUrl,
		formOf: form && root ? {
			...form,
			label: formOfLabel(form)
		} : null,
		root,
		example,
		rhymes
	};
}
function pickExample(pools) {
	for (const pool of pools) for (const meaning of pool.meanings) for (const sense of meaning.senses) if (sense.example && sense.example.length > 8) return {
		text: sense.example,
		source: pool.source
	};
	return null;
}
async function fetchDatamuseRelated(word, self) {
	if (!WORD.test(word)) return {
		synonyms: [],
		rhymes: []
	};
	const q = encodeURIComponent(word.toLowerCase());
	const [syn, rhy] = await Promise.all([fetchJson(`https://api.datamuse.com/words?rel_syn=${q}&max=10`, 3e3, 0), fetchJson(`https://api.datamuse.com/words?rel_rhy=${q}&max=10`, 3e3, 0)]);
	const words = (res, max) => (Array.isArray(res?.json) ? res.json : []).map((row) => row.word?.trim() ?? "").filter((item) => item && WORD.test(item) && item.toLowerCase() !== self.toLowerCase() && item.toLowerCase() !== word.toLowerCase()).slice(0, max);
	return {
		synonyms: words(syn, 8),
		rhymes: words(rhy, 8)
	};
}
/**
* "Did you mean" for a word no source knows: Datamuse spelled-like and
* sounds-like, plus Wiktionary's own search suggestion. Real words only.
*/
async function spellingSuggestions(raw) {
	const word = raw.trim().toLowerCase();
	if (word.length < 2 || !WORD.test(word)) return [];
	const hit = suggestCache.get(`dym:${word}`);
	if (hit && Date.now() - hit.at < 6e5) return hit.words;
	const q = encodeURIComponent(word);
	const search = new URLSearchParams({
		action: "query",
		list: "search",
		srsearch: word,
		srinfo: "suggestion",
		srlimit: "5",
		srnamespace: "0",
		format: "json"
	});
	const [spelled, sounds, wiki] = await Promise.all([
		fetchJson(`https://api.datamuse.com/words?sp=${q}&max=6`, 3e3, 0),
		fetchJson(`https://api.datamuse.com/words?sl=${q}&max=6`, 3e3, 0),
		fetchJson(`https://en.wiktionary.org/w/api.php?${search}`, 4e3, 0)
	]);
	const out = [];
	const add = (value) => {
		const clean = value?.trim();
		if (!clean || !WORD.test(clean) || clean.toLowerCase() === word) return;
		if (out.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
		out.push(clean);
	};
	const rows = (res) => Array.isArray(res?.json) ? res.json : [];
	for (const row of rows(spelled)) add(row.word);
	const wikiBody = wiki?.json;
	add(wikiBody?.query?.searchinfo?.suggestion);
	for (const row of rows(sounds).slice(0, 4)) add(row.word);
	for (const row of (wikiBody?.query?.search ?? []).slice(0, 3)) if (row.title && !row.title.includes(" ") && row.title.length <= word.length + 3) add(row.title);
	const words = out.slice(0, 8);
	suggestCache.set(`dym:${word}`, {
		at: Date.now(),
		words
	});
	return words;
}
async function fetchDictionary(word) {
	const apiKey = process.env.MERRIAM_WEBSTER_DICTIONARY_API_KEY;
	if (!apiKey) return fetchFreeDictionary(word);
	const result = await fetchMerriamDictionary(word, apiKey);
	if (result.entry || result.busy) return result;
	const fallback = await fetchFreeDictionary(word);
	if (fallback.entry) return fallback;
	return {
		entry: null,
		missing: result.missing || fallback.missing,
		busy: fallback.busy
	};
}
async function fetchMerriamDictionary(word, apiKey) {
	const url = new URL(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}`);
	url.searchParams.set("key", apiKey);
	const res = await fetchJson(url.toString(), 5e3, 1);
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
	const records = res.json.filter((record) => typeof record === "object" && record !== null);
	const meanings = [];
	const etymologies = [];
	let display = word;
	let phonetic = null;
	let audio = null;
	for (const record of records) {
		if (typeof record.hwi?.hw === "string" && record.hwi.hw) display = record.hwi.hw.replaceAll("*", "");
		const pronunciation = record.hwi?.prs?.[0];
		if (!phonetic && pronunciation?.ipa) phonetic = pronunciation.ipa;
		if (!audio && pronunciation?.sound?.audio) audio = merriamAudioUrl(pronunciation.sound.audio);
		const partOfSpeech = record.fl || "entry";
		const definitions = (record.shortdef ?? []).filter((definition) => typeof definition === "string" && definition.trim().length > 0).slice(0, 3).map((definition) => ({
			definition: definition.trim(),
			example: null
		}));
		if (definitions.length && meanings.length < 4) meanings.push({
			partOfSpeech,
			senses: definitions
		});
		const origin = merriamText(record.et);
		if (origin && etymologies.length < 2) etymologies.push({
			label: "Etymology",
			paragraphs: [origin]
		});
	}
	if (meanings.length === 0 && etymologies.length === 0) return {
		entry: null,
		missing: records.length === 0,
		busy: false
	};
	return {
		entry: {
			word: display,
			phonetic,
			audio,
			meanings,
			etymologies,
			synonyms: [],
			antonyms: [],
			source: "Merriam-Webster"
		},
		missing: false,
		busy: false
	};
}
async function fetchThesaurus(word) {
	const apiKey = process.env.MERRIAM_WEBSTER_THESAURUS_API_KEY;
	if (!apiKey) return {
		synonyms: [],
		antonyms: [],
		available: false
	};
	const url = new URL(`https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${encodeURIComponent(word)}`);
	url.searchParams.set("key", apiKey);
	const res = await fetchJson(url.toString(), 5e3, 1);
	if (!res || res.status !== 200 || !Array.isArray(res.json)) return {
		synonyms: [],
		antonyms: [],
		available: false
	};
	const records = res.json.filter((record) => typeof record === "object" && record !== null);
	if (records.length === 0) return {
		synonyms: [],
		antonyms: [],
		available: false
	};
	const synonyms = /* @__PURE__ */ new Set();
	const antonyms = /* @__PURE__ */ new Set();
	for (const record of records) {
		collectNestedWords(synonyms, record.meta?.syns);
		collectNestedWords(antonyms, record.meta?.ants);
	}
	const self = word.toLowerCase();
	return {
		synonyms: [...synonyms].filter((item) => item.toLowerCase() !== self).slice(0, 10),
		antonyms: [...antonyms].filter((item) => item.toLowerCase() !== self).slice(0, 6),
		available: true
	};
}
async function fetchFreeDictionary(word) {
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
			etymologies: [],
			synonyms: [...synonyms].filter((item) => item.toLowerCase() !== self).slice(0, 10),
			antonyms: [...antonyms].filter((item) => item.toLowerCase() !== self).slice(0, 6),
			source: "Dictionary API"
		},
		missing: meanings.length === 0,
		busy: false
	};
}
function merriamAudioUrl(audio) {
	return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audio.startsWith("bix") ? "bix" : audio.startsWith("gg") ? "gg" : /^\d/.test(audio) ? "number" : audio[0]?.toLowerCase() ?? "a"}/${encodeURIComponent(audio)}.mp3`;
}
function merriamText(value) {
	const fragments = [];
	const visit = (item) => {
		if (typeof item === "string") {
			const fragment = item.trim();
			if (fragment && !fragments.includes(fragment)) fragments.push(fragment);
		} else if (Array.isArray(item)) item.forEach(visit);
	};
	visit(value);
	return cleanMerriam(fragments.join(" ")).slice(0, 600);
}
/** Strip Merriam-Webster inline markup: {it}x{/it}, {et_link|a|b}, {ma}…{/ma}. */
function cleanMerriam(text) {
	return text.replace(/^\s*text\s+/i, "").replace(/\{ma\}[\s\S]*?\{\/ma\}/g, "").replace(/\{dx_ety\}[\s\S]*?\{\/dx_ety\}/g, "").replace(/\{(?:et_link|d_link|a_link|i_link|sx|dxt|mat)\|([^|}]*)[^}]*\}/g, "$1").replace(/\{\/?(?:it|b|sc|inf|sup|parahw|phrase|qword|wi|gloss|bc|ldquo|rdquo)\}/g, (m) => m === "{ldquo}" || m === "{rdquo}" ? "\"" : "").replace(/\{[^}]*\}/g, "").replace(/\s+([,.;:])/g, "$1").replace(/\s+/g, " ").trim();
}
function collectNestedWords(into, value) {
	if (typeof value === "string") {
		const clean = value.trim();
		if (clean.length > 1 && clean.length < 40 && WORD.test(clean)) into.add(clean);
	} else if (Array.isArray(value)) value.forEach((item) => collectNestedWords(into, item));
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
	})}`, 1e4, 2);
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
	const meanings = extractRichMeanings(english).map((meaning) => ({
		partOfSpeech: meaning.partOfSpeech,
		senses: meaning.senses.map((sense) => ({
			definition: sense.text,
			example: sense.example,
			formOf: sense.formOf
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
			await delay(800 * (attempt + 1));
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
				example: sense.example,
				formOf: sense.formOf ?? null
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
export { didYouMean_createServerFn_handler, lookupWord_createServerFn_handler, suggestWords_createServerFn_handler };
