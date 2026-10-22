import { useEffect, useId, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Search, Share2, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggestWords, type LookupResult, type Meaning } from "@/lib/dictionary";
import { fetchAiExample, fetchContext, getAiStatus } from "@/lib/ai/client";
import type { ContextResponse } from "@/lib/ai/config";
import { SAMPLE_WORDS } from "@/lib/words";

const RECENT_KEY = "etymon.recent";

type Props = {
  result: LookupResult;
  daily: boolean;
  query: string;
  isLoading: boolean;
  onSearch: (word: string) => void;
};

export function DictionaryApp({ result, daily, query, isLoading, onSearch }: Props) {
  const listId = useId();
  const [draft, setDraft] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setDraft(query);
    setSuggestions([]);
    setActive(-1);
  }, [query]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    if (!daily && result.ok) setRecent(remember(result.word));
  }, [daily, result]);

  useEffect(() => {
    const q = draft.trim();
    if (q.length < 2 || q.toLowerCase() === query.trim().toLowerCase()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void suggestWords({ data: { q } })
        .then((words) => {
          if (!cancelled) {
            setSuggestions(words);
            setActive(-1);
          }
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, query]);

  function submit(word: string) {
    const next = word.trim().replace(/\s+/g, " ");
    if (!next) return;
    setSuggestions([]);
    onSearch(next);
  }

  const showSuggest = suggestions.length > 0 && draft.trim().toLowerCase() !== query.trim().toLowerCase();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-5 pb-12 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-line py-5">
          <a href="/" aria-label="Etymon home" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-oxide text-oxide-ink">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-ink">
              Etymon<span className="text-oxide">.</span>
            </span>
          </a>
          <p className="hidden text-sm font-medium text-muted sm:block">A field guide to word origins</p>
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-col pt-12 sm:pt-16 lg:pt-20" aria-label="Word search">
          <p className="mb-4 text-xs font-bold tracking-[0.18em] text-oxide uppercase">The word archive</p>
          <h1 className="max-w-2xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Every word has a past.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Follow the trail from today&apos;s meaning back to where it all began.
          </p>

          <form
            className="relative mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              const picked = active >= 0 ? suggestions[active] : draft;
              submit(picked ?? draft);
            }}
          >
            <label htmlFor="lookup" className="sr-only">
              Look up a word
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-sheet p-2 shadow-[0_12px_32px_-24px_var(--color-ink)] transition focus-within:border-oxide focus-within:ring-2 focus-within:ring-oxide/15">
              <Search className="ml-3 size-5 shrink-0 text-muted" aria-hidden="true" />
              <input
                id="lookup"
                name="q"
                value={draft}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggest}
                aria-controls={listId}
                aria-activedescendant={active >= 0 ? `${listId}-option-${active}` : undefined}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                placeholder="Search a word…"
                className="h-12 min-w-0 flex-1 bg-transparent font-sans text-lg text-ink outline-none placeholder:text-muted"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (!showSuggest) return;
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((index) => (index + 1) % suggestions.length);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
                  } else if (event.key === "Escape") {
                    setSuggestions([]);
                    setActive(-1);
                  }
                }}
              />
              <Button type="submit" className="shrink-0 rounded-xl px-5">
                Explore
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
            {showSuggest ? (
              <ul
                id={listId}
                role="listbox"
                className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-line bg-sheet p-1 shadow-lg"
              >
                {suggestions.map((word, index) => (
                  <li key={word}>
                    <button
                      id={`${listId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      className={
                        index === active
                          ? "flex h-11 w-full items-center rounded-lg px-3 text-left font-medium text-oxide"
                          : "flex h-11 w-full items-center rounded-lg px-3 text-left text-ink hover:bg-paper"
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => submit(word)}
                    >
                      {word}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
          <p className="mt-3 text-sm text-muted">Search any word, then explore its definition and roots.</p>

          <div className="mt-8 flex flex-col gap-4">
            <ChipRow label="Start exploring" words={SAMPLE_WORDS.slice(0, 6)} onPick={submit} />
            {recent.length > 0 ? <ChipRow label="Recently viewed" words={recent} onPick={submit} /> : null}
          </div>
        </section>

        {isLoading ? (
          <p className="mx-auto mt-10 w-full max-w-3xl text-sm font-medium text-muted" role="status">
            Following the trail…
          </p>
        ) : null}

        <section className="mx-auto mt-10 w-full max-w-3xl" aria-live="polite" aria-busy={isLoading}>
          {result.ok ? (
            <Entry result={result} daily={daily} onSearch={submit} />
          ) : (
            <Miss result={result} onSearch={submit} />
          )}
        </section>

        <footer className="mx-auto mt-12 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted">
          <span>
            Definitions: {result.ok ? result.dictionarySource : "Wiktionary, Free Dictionary API"} · Related words: {result.ok ? result.thesaurusSource : "Merriam-Webster"}
          </span>
          <span>
            Origins: {result.ok ? result.etymologySource : "Wiktionary"}
            {result.ok && result.etymologySource.startsWith("Wiktionary") ? ", shared under CC BY-SA." : "."}
          </span>
          <span className="w-full text-xs">Suggestions and rhymes by Datamuse. Items marked AI are written by Grok (xAI).</span>
        </footer>
      </div>
    </main>
  );
}

function ChipRow({
  label,
  words,
  onPick,
}: {
  label: string;
  words: readonly string[];
  onPick: (word: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-sm font-semibold text-muted">{label}</span>
      <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto pb-1">
        {words.map((word) => (
          <Button key={`${label}-${word}`} variant="quiet" size="sm" className="shrink-0 rounded-full bg-transparent" onClick={() => onPick(word)}>
            {word}
          </Button>
        ))}
      </div>
    </div>
  );
}

type Found = Extract<LookupResult, { ok: true }>;
type FlatSense = { partOfSpeech: string; definition: string };

function flattenSenses(result: Found): FlatSense[] {
  const all = [...result.meanings, ...(result.root?.meanings ?? [])];
  return all.flatMap((meaning) =>
    meaning.senses.map((sense) => ({ partOfSpeech: meaning.partOfSpeech, definition: sense.definition })),
  );
}

function useAiAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void getAiStatus().then((status) => {
      if (live) setAvailable(status.available);
    });
    return () => {
      live = false;
    };
  }, []);
  return available;
}

function Entry({
  result,
  daily,
  onSearch,
}: {
  result: Found;
  daily: boolean;
  onSearch: (word: string) => void;
}) {
  const ai = useAiAvailable();
  const [context, setContext] = useState<ContextResponse | null>(null);
  useEffect(() => setContext(null), [result.word]);
  const flat = flattenSenses(result);
  const highlight = context?.bestSense ?? null;
  const ownCount = result.meanings.reduce((sum, meaning) => sum + meaning.senses.length, 0);
  const hasInlineExample = [...result.meanings, ...(result.root?.meanings ?? [])].some((meaning) =>
    meaning.senses.some((sense) => Boolean(sense.example)),
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-sheet shadow-[0_16px_48px_-36px_var(--color-ink)]">
      <div className="border-b border-line px-5 py-7 sm:px-8 sm:py-9">
        {daily ? (
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-oxide uppercase">
            <span className="size-2 rounded-full bg-oxide" aria-hidden="true" />
            Word of the day
          </p>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-full min-w-0 font-display text-5xl leading-tight font-medium tracking-tight break-words text-ink sm:text-6xl">
            {result.word}
          </h2>
          <div className="flex items-center gap-3 pb-1">
            {result.phonetic ? <p className="font-mono text-base text-muted">{result.phonetic}</p> : null}
            <Pronounce src={result.audio} word={result.word} />
            <ShareButton word={result.word} />
          </div>
        </div>
        {result.formOf ? (
          <p className="mt-3 text-base leading-relaxed text-muted">
            {result.formOf.relation} of{" "}
            <a
              href={`/?q=${encodeURIComponent(result.formOf.lemma)}`}
              className="font-semibold text-oxide underline underline-offset-4"
              onClick={(event) => {
                event.preventDefault();
                onSearch(result.formOf!.lemma);
              }}
            >
              {result.formOf.lemma}
            </a>
            {result.root ? <span>. Its definitions are shown below.</span> : null}
          </p>
        ) : null}
      </div>

      <div className="px-5 py-7 sm:px-8 sm:py-8">
        {result.meanings.length > 0 ? (
          <MeaningList meanings={result.meanings} offset={0} highlight={highlight} />
        ) : !result.root ? (
          <p className="text-base leading-relaxed text-muted">No short definition was found. The origin is below.</p>
        ) : null}

        {result.root ? (
          <section className={result.meanings.length > 0 ? "mt-9 border-t border-line pt-7" : ""} aria-label={`Definitions of ${result.root.word}`}>
            <p className="text-sm text-muted">Definitions of the root word</p>
            <h3 className="mt-1 mb-5 flex flex-wrap items-baseline gap-x-3 font-display text-3xl font-medium tracking-tight text-ink">
              {result.root.word}
              {result.root.phonetic ? <span className="font-mono text-sm font-normal text-muted">{result.root.phonetic}</span> : null}
            </h3>
            <MeaningList meanings={result.root.meanings} offset={ownCount} highlight={highlight} />
          </section>
        ) : null}

        {!hasInlineExample ? <ExampleBlock result={result} ai={ai} /> : null}

        {ai ? (
          <ContextBox
            word={result.word}
            senses={flat}
            hint="Paste the sentence it's in and Grok will pick the meaning that fits."
            onResult={setContext}
          />
        ) : null}
        {context ? <ContextResult result={context} senses={flat} onSearch={onSearch} /> : null}

        <section className="mt-8 rounded-xl bg-paper p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold tracking-[0.16em] text-oxide uppercase">The origin</h3>
            <BookOpen className="size-4 text-oxide" aria-hidden="true" />
          </div>
          {result.etymologies.length > 0 ? (
            <div className="mt-3 flex flex-col gap-4">
              {result.etymologyNote ? <p className="text-sm text-muted">{result.etymologyNote}</p> : null}
              {result.etymologies.map((block, index) => (
                <div key={block.paragraphs[0]?.slice(0, 48) ?? block.label}>
                  {index > 0 ? <h4 className="text-sm font-semibold text-muted">Another origin</h4> : null}
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="mt-2 text-base leading-relaxed break-words text-ink">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-ink">{result.etymologyNote}</p>
          )}
          <a
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-oxide underline-offset-4 hover:underline"
            href={result.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Read the full entry
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </section>

        {result.synonyms.length > 0 ? (
          <WordChips label="Related words" words={result.synonyms} onSearch={onSearch} />
        ) : null}
        {result.rhymes.length > 0 ? <WordChips label="Rhymes" words={result.rhymes} onSearch={onSearch} /> : null}

        {result.antonyms.length > 0 ? (
          <p className="mt-5 text-sm leading-relaxed text-muted"><span className="font-semibold text-ink">Opposite:</span> {result.antonyms.join(", ")}</p>
        ) : null}
      </div>
    </article>
  );
}

function WordChips({ label, words, onSearch }: { label: string; words: string[]; onSearch: (word: string) => void }) {
  return (
    <div className="mt-7">
      <h3 className="text-xs font-bold tracking-[0.16em] text-muted uppercase">{label}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((word) => (
          <Button key={`${label}-${word}`} variant="quiet" size="sm" className="max-w-full rounded-full" onClick={() => onSearch(word)}>
            <span className="truncate">{word}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function MeaningList({ meanings, offset, highlight }: { meanings: Meaning[]; offset: number; highlight: number | null }) {
  let flatIndex = offset;
  return (
    <div className="flex flex-col gap-8">
      {meanings.map((meaning) => (
        <section key={meaning.partOfSpeech}>
          <h3 className="text-xs font-bold tracking-[0.16em] text-oxide uppercase">{meaning.partOfSpeech}</h3>
          <ol className="mt-4 flex flex-col gap-5">
            {meaning.senses.map((sense, index) => {
              const gloss = splitGloss(sense.definition);
              const mine = flatIndex++;
              const isBest = highlight === mine;
              return (
                <li
                  key={`${meaning.partOfSpeech}-${index}`}
                  className={isBest ? "-mx-3 flex gap-4 rounded-xl bg-oxide/8 p-3 ring-1 ring-oxide/30" : "flex gap-4"}
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-sm font-medium text-oxide" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    {isBest ? (
                      <p className="mb-1 text-xs font-bold tracking-[0.12em] text-oxide uppercase">Best match for your sentence</p>
                    ) : null}
                    {gloss.note ? <p className="text-sm leading-relaxed text-muted">{gloss.note}</p> : null}
                    <p className="text-base leading-relaxed break-words text-ink sm:text-lg">{gloss.text}</p>
                    {sense.example ? (
                      <p className="mt-2 border-l-2 border-line pl-3 text-base leading-relaxed break-words text-muted italic">
                        {sense.example}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function ExampleBlock({ result, ai }: { result: Found; ai: boolean | null }) {
  const [aiExample, setAiExample] = useState<{ word: string; text: string } | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const first = result.meanings[0] ?? result.root?.meanings[0];
  const sense = first?.senses[0];

  useEffect(() => {
    if (result.example || !ai || !sense || !first) return;
    let live = true;
    setState("loading");
    fetchAiExample({ word: result.word, partOfSpeech: first.partOfSpeech, definition: sense.definition })
      .then((res) => {
        if (!live) return;
        setAiExample({ word: result.word, text: res.sentence });
        setState("idle");
      })
      .catch(() => {
        if (live) setState("error");
      });
    return () => {
      live = false;
    };
  }, [result.word, result.example, ai, sense, first]);

  if (result.example) {
    return (
      <section className="mt-8" aria-label="Example">
        <h3 className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Example</h3>
        <p className="mt-3 border-l-2 border-oxide/40 pl-3 text-base leading-relaxed break-words text-ink italic sm:text-lg">
          {result.example.text}
        </p>
        <p className="mt-1 pl-3 text-xs text-muted">From {result.example.source}</p>
      </section>
    );
  }
  if (!ai || !sense) return null;
  return (
    <section className="mt-8" aria-label="Example (AI)" aria-busy={state === "loading"}>
      <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-muted uppercase">
        Example <span className="rounded-full bg-paper px-2 py-0.5 tracking-normal text-oxide normal-case">AI</span>
      </h3>
      {state === "loading" ? (
        <p className="mt-3 text-sm text-muted" role="status">Writing an example with Grok…</p>
      ) : state === "error" ? (
        <p className="mt-3 text-sm text-muted">No example is available right now.</p>
      ) : aiExample && aiExample.word === result.word ? (
        <>
          <p className="mt-3 border-l-2 border-line pl-3 text-base leading-relaxed break-words text-ink italic sm:text-lg">
            {aiExample.text}
          </p>
          <p className="mt-1 pl-3 text-xs text-muted">Example (AI) · written by Grok, not from a dictionary</p>
        </>
      ) : null}
    </section>
  );
}

function ContextBox({
  word,
  senses,
  hint,
  defaultOpen = false,
  onResult,
}: {
  word: string;
  senses: FlatSense[];
  hint: string;
  defaultOpen?: boolean;
  onResult: (result: ContextResponse | null) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [sentence, setSentence] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setSentence("");
    setError(null);
    setOpen(defaultOpen);
  }, [word, defaultOpen]);

  async function run() {
    const text = sentence.trim();
    if (text.length < 3) {
      setError("Paste the sentence the word appears in.");
      return;
    }
    setState("loading");
    setError(null);
    try {
      const res = await fetchContext({ word, sentence: text, senses: senses.slice(0, 12) });
      onResult(res);
    } catch (err) {
      onResult(null);
      setError(err instanceof Error ? err.message : "Grok couldn't answer just now.");
    } finally {
      setState("idle");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-line px-4 text-sm font-semibold text-oxide hover:border-oxide"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Seen it in a sentence? Paste it for context
      </button>
    );
  }
  return (
    <section className="mt-8 rounded-xl border border-line p-4 sm:p-5" aria-label="Paste the sentence it's in">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        Paste the sentence it&apos;s in
      </label>
      <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>
      <textarea
        id={id}
        value={sentence}
        maxLength={600}
        rows={3}
        placeholder={`e.g. a sentence that uses “${word}”`}
        className="mt-3 block w-full resize-y rounded-lg border border-line bg-paper p-3 text-base leading-relaxed text-ink outline-none placeholder:text-muted focus:border-oxide focus:ring-2 focus:ring-oxide/15"
        onChange={(event) => setSentence(event.target.value)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" className="rounded-xl" disabled={state === "loading"} onClick={() => void run()}>
          <Sparkles className="size-4" aria-hidden="true" />
          {state === "loading" ? "Reading the sentence…" : "Explain in context"}
        </Button>
        <span className="text-xs text-muted">{sentence.length}/600 · sent to Grok (xAI)</span>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-oxide" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ContextResult({
  result,
  senses,
  onSearch,
}: {
  result: ContextResponse;
  senses: FlatSense[];
  onSearch: (word: string) => void;
}) {
  const best = result.bestSense != null ? senses[result.bestSense] : null;
  return (
    <section className="mt-5 rounded-xl border border-oxide/30 bg-paper p-5 sm:p-6" aria-live="polite" aria-label="AI-inferred from context">
      <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.16em] text-oxide uppercase">
        <Sparkles className="size-3.5" aria-hidden="true" /> AI-inferred from context
        <span className="rounded-full bg-sheet px-2 py-0.5 tracking-normal text-muted normal-case">{result.confidence} confidence</span>
      </p>
      <p className="mt-3 text-base leading-relaxed break-words text-ink sm:text-lg">
        <span className="font-display font-medium">{result.word}</span>
        {result.partOfSpeech ? <span className="text-muted"> · {result.partOfSpeech}</span> : null}
        {result.lemma && result.lemma.toLowerCase() !== result.word.toLowerCase() ? (
          <span className="text-muted">
            {" "}· root{" "}
            <button type="button" className="font-semibold text-oxide underline underline-offset-4" onClick={() => onSearch(result.lemma)}>
              {result.lemma}
            </button>
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-base leading-relaxed break-words text-ink">{result.definition}</p>
      {best ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Closest dictionary sense ({best.partOfSpeech}): <span className="text-ink">{best.definition}</span>
        </p>
      ) : null}
      {result.origin ? (
        <p className="mt-3 text-sm leading-relaxed break-words text-muted">
          <span className="font-semibold text-ink">Likely origin:</span> {result.origin}
        </p>
      ) : null}
      {result.note ? <p className="mt-3 text-sm leading-relaxed text-muted">{result.note}</p> : null}
      <p className="mt-4 text-xs text-muted">Written by Grok from your sentence. Check it against a dictionary before relying on it.</p>
    </section>
  );
}

function Miss({
  result,
  onSearch,
}: {
  result: Extract<LookupResult, { ok: false }>;
  onSearch: (word: string) => void;
}) {
  const ai = useAiAvailable();
  const [context, setContext] = useState<ContextResponse | null>(null);
  useEffect(() => setContext(null), [result.word]);
  const copy = {
    invalid: "Use a word made of letters, spaces, or hyphens.",
    missing: `No entry for “${result.word}”.${result.suggestions.length ? " Did you mean one of these?" : " Try another spelling."}`,
    busy: "The dictionary is busy. Try again in a moment.",
    failed: "The dictionary couldn’t be reached just now.",
  }[result.reason];

  return (
    <article className="rounded-2xl border border-line bg-sheet px-5 py-8 sm:px-8">
      <p className="text-xs font-bold tracking-[0.16em] text-oxide uppercase">No entry found</p>
      <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">Let&apos;s try another trail.</h2>
      <p className="mt-2 max-w-xl text-base leading-relaxed break-words text-muted">{copy}</p>
      {result.suggestions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Spelling suggestions">
          {result.suggestions.map((word) => (
            <Button key={word} variant="quiet" size="sm" className="max-w-full rounded-full" onClick={() => onSearch(word)}>
              <span className="truncate">{word}</span>
            </Button>
          ))}
        </div>
      ) : null}
      {result.reason === "busy" || result.reason === "failed" ? (
        <Button className="mt-5" onClick={() => onSearch(result.word)}>
          Try again
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
      {result.reason === "missing" || result.reason === "failed" ? (
        ai ? (
          <>
            <ContextBox
              word={result.word}
              senses={[]}
              defaultOpen
              hint="Grok will read the sentence and suggest what the word most likely means."
              onResult={setContext}
            />
            {context ? <ContextResult result={context} senses={[]} onSearch={onSearch} /> : null}
          </>
        ) : ai === false ? (
          <p className="mt-6 text-sm text-muted">Explaining a word from its sentence needs AI, which isn&apos;t set up on this site yet.</p>
        ) : null
      ) : null}
    </article>
  );
}

function ShareButton({ word }: { word: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Share ${word}`}
      className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-oxide hover:text-oxide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide"
      onClick={() => {
        const url = `${window.location.origin}/?w=${encodeURIComponent(word)}`;
        if (navigator.share) {
          void navigator.share({ title: `${word} — Etymon`, url }).catch(() => undefined);
          return;
        }
        void navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? <Check className="size-5" aria-hidden /> : <Share2 className="size-5" aria-hidden />}
      <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </button>
  );
}

function Pronounce({ src, word }: { src: string | null; word: string }) {
  const [canSpeak, setCanSpeak] = useState(Boolean(src));
  useEffect(() => {
    if (!src) setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    else setCanSpeak(true);
  }, [src]);
  if (!canSpeak) return null;
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };
  return (
    <button
      type="button"
      aria-label={src ? `Play pronunciation of ${word}` : `Say ${word} (device voice)`}
      title={src ? "Recorded pronunciation" : "Spoken by your device's voice"}
      className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-oxide hover:text-oxide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide"
      onClick={() => {
        if (!src) return speak();
        const audio = new Audio(src);
        void audio.play().catch(speak);
      }}
    >
      <Volume2 className="size-5" aria-hidden />
    </button>
  );
}

function splitGloss(definition: string): { note: string | null; text: string } {
  const match = definition.match(/^\(([^)]{2,80})\)\s+([\s\S]+)$/);
  if (!match?.[1] || !match[2]) return { note: null, text: definition };
  return { note: match[1], text: match[2] };
}

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 6);
  } catch {
    return [];
  }
}

function remember(word: string): string[] {
  const next = [word, ...readRecent().filter((item) => item.toLowerCase() !== word.toLowerCase())].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
