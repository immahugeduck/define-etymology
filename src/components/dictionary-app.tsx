import { useEffect, useId, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Loader2, Search, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { suggestWords, type LookupResult } from "@/lib/dictionary";
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
  const [pendingWord, setPendingWord] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) setPendingWord(null);
  }, [isLoading]);

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
    setPendingWord(next);
    onSearch(next);
  }

  const loadingWord = pendingWord ?? draft.trim();
  const showSuggest = suggestions.length > 0 && draft.trim().toLowerCase() !== query.trim().toLowerCase();

  return (
    <main className="min-h-screen bg-paper text-ink">
      {isLoading ? (
        <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-oxide/15" aria-hidden="true">
          <div className="loading-bar h-full w-2/5 rounded-full bg-oxide" />
        </div>
      ) : null}
      <div role="status" className="sr-only">
        {isLoading ? `Looking up ${loadingWord}` : ""}
      </div>
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
              <Button type="submit" className="min-w-32 shrink-0 rounded-xl px-5">
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Searching
                  </>
                ) : (
                  <>
                    Explore
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
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
          <div
            className="sticky top-3 z-40 mx-auto mt-10 flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-oxide/30 bg-sheet px-4 py-3 shadow-[0_12px_32px_-20px_var(--color-ink)]"
            aria-hidden="true"
          >
            <Loader2 className="size-5 shrink-0 animate-spin text-oxide" />
            <p className="min-w-0 text-base leading-relaxed text-ink">
              <span className="font-semibold">Looking up “{loadingWord}”</span>
              <span className="text-muted"> · checking definitions and origins</span>
            </p>
          </div>
        ) : null}

        <section
          className={cn(
            "mx-auto mt-10 w-full max-w-3xl transition-opacity duration-300",
            isLoading && "pointer-events-none opacity-40",
          )}
          aria-busy={isLoading}
        >
          {result.ok ? (
            <Entry result={result} daily={daily} onSearch={submit} />
          ) : (
            <Miss result={result} onSearch={submit} />
          )}
        </section>

        <footer className="mx-auto mt-12 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted">
          <span>
            Definitions: {result.ok ? result.dictionarySource : "Merriam-Webster or Wiktionary"} · Related words: {result.ok ? result.thesaurusSource : "Merriam-Webster"}
          </span>
          <span>
            Origins: {result.ok ? result.etymologySource : "Wiktionary"}
            {result.ok && result.etymologySource === "Wiktionary" ? ", shared under CC BY-SA." : "."}
          </span>
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

function Entry({
  result,
  daily,
  onSearch,
}: {
  result: Extract<LookupResult, { ok: true }>;
  daily: boolean;
  onSearch: (word: string) => void;
}) {
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
          <h2 className="max-w-full font-display text-5xl leading-tight font-medium tracking-tight break-words text-ink sm:text-6xl">
            {result.word}
          </h2>
          <div className="flex items-center gap-3 pb-1">
            {result.phonetic ? <p className="font-sans text-lg text-muted">{result.phonetic}</p> : null}
            {result.audio ? <Pronounce src={result.audio} word={result.word} /> : null}
          </div>
        </div>
      </div>

      <div className="px-5 py-7 sm:px-8 sm:py-8">
        {result.meanings.length > 0 ? (
          <div className="flex flex-col gap-8">
            {result.meanings.map((meaning) => (
              <section key={meaning.partOfSpeech}>
                <h3 className="text-xs font-bold tracking-[0.16em] text-oxide uppercase">
                  {meaning.partOfSpeech}
                </h3>
                <ol className="mt-4 flex flex-col gap-5">
                  {meaning.senses.map((sense, index) => {
                    const gloss = splitGloss(sense.definition);
                    return (
                      <li key={`${meaning.partOfSpeech}-${index}`} className="flex gap-4">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-sm font-medium text-oxide" aria-hidden="true">
                          {index + 1}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          {gloss.note ? <p className="text-sm leading-relaxed text-muted">{gloss.note}</p> : null}
                          <p className="text-base leading-relaxed text-ink sm:text-lg">{gloss.text}</p>
                          {sense.example ? (
                            <p className="mt-2 border-l-2 border-line pl-3 text-base leading-relaxed text-muted italic">
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
        ) : (
          <p className="text-base leading-relaxed text-muted">No short definition was found. The origin is below.</p>
        )}

        <section className="mt-8 rounded-xl bg-paper p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold tracking-[0.16em] text-oxide uppercase">The origin</h3>
            <BookOpen className="size-4 text-oxide" aria-hidden="true" />
          </div>
          {result.etymologies.length > 0 ? (
            <div className="mt-3 flex flex-col gap-4">
              {result.etymologies.map((block, index) => (
                <div key={block.paragraphs[0]?.slice(0, 48) ?? block.label}>
                  {index > 0 ? <h4 className="text-sm font-semibold text-muted">Another origin</h4> : null}
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="mt-2 text-base leading-relaxed text-ink">
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
          <div className="mt-7">
            <h3 className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Related words</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.synonyms.map((word) => (
                <Button key={word} variant="quiet" size="sm" className="rounded-full" onClick={() => onSearch(word)}>
                  {word}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {result.antonyms.length > 0 ? (
          <p className="mt-5 text-sm leading-relaxed text-muted"><span className="font-semibold text-ink">Opposite:</span> {result.antonyms.join(", ")}</p>
        ) : null}
      </div>
    </article>
  );
}

function Miss({
  result,
  onSearch,
}: {
  result: Extract<LookupResult, { ok: false }>;
  onSearch: (word: string) => void;
}) {
  const copy = {
    invalid: "Use a word made of letters, spaces, or hyphens.",
    missing: `No entry for “${result.word}”. Try another spelling.`,
    busy: "The dictionary is busy. Try again in a moment.",
    failed: "The dictionary couldn’t be reached just now.",
  }[result.reason];

  return (
    <article className="rounded-2xl border border-line bg-sheet px-6 py-8 sm:px-8">
      <p className="text-xs font-bold tracking-[0.16em] text-oxide uppercase">No entry found</p>
      <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">Let&apos;s try another trail.</h2>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">{copy}</p>
      {result.reason === "busy" || result.reason === "failed" ? (
        <Button className="mt-5" onClick={() => onSearch(result.word)}>
          Try again
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
    </article>
  );
}

function Pronounce({ src, word }: { src: string; word: string }) {
  return (
    <button
      type="button"
      aria-label={`Play pronunciation of ${word}`}
      className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-oxide hover:text-oxide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide"
      onClick={() => {
        const audio = new Audio(src);
        void audio.play().catch(() => undefined);
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
