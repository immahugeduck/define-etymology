import { useEffect, useId, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="mx-auto flex w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-display text-3xl font-medium tracking-tight text-ink">
            Etymon<span className="text-oxide">.</span>
          </p>
          <p className="text-sm text-muted">Definition and origin</p>
        </header>

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
          <div className="flex items-end gap-3">
            <input
              id="lookup"
              name="q"
              value={draft}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggest}
              aria-controls={listId}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder="Look up a word"
              className="h-12 min-w-0 flex-1 border-b border-line bg-transparent font-display text-2xl text-ink outline-none placeholder:text-muted focus:border-oxide"
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
            <Button type="submit" className="shrink-0">
              Look up
            </Button>
          </div>
          {showSuggest ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-10 mt-2 w-full border border-line bg-sheet shadow-sm"
            >
              {suggestions.map((word, index) => (
                <li key={word}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className={
                      index === active
                        ? "flex h-11 w-full items-center px-3 text-left text-oxide"
                        : "flex h-11 w-full items-center px-3 text-left text-ink hover:text-oxide"
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

        <ChipRow
          label="Try"
          words={SAMPLE_WORDS.slice(0, 6)}
          onPick={submit}
        />
        {recent.length > 0 ? <ChipRow label="Recent" words={recent} onPick={submit} /> : null}

        <div className="mt-8 h-px bg-line" aria-hidden />
        {isLoading ? <p className="mt-3 text-sm text-muted">Looking up…</p> : null}

        <section className="mt-6" aria-live="polite" aria-busy={isLoading}>
          {result.ok ? (
            <Entry result={result} daily={daily} onSearch={submit} />
          ) : (
            <Miss result={result} onSearch={submit} />
          )}
        </section>

        <footer className="mt-10 text-sm text-muted">Entries from Wiktionary, CC BY-SA.</footer>
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
    <div className="mt-4 flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {words.map((word) => (
          <Button key={`${label}-${word}`} variant="quiet" size="sm" className="shrink-0" onClick={() => onPick(word)}>
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
    <article className="border border-line bg-sheet px-5 py-6 sm:px-8 sm:py-8">
      {daily ? (
        <p className="text-sm font-semibold tracking-widest text-oxide uppercase">Word of the day</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-5xl font-medium tracking-tight break-words text-ink">
          {result.word}
        </h1>
        <div className="flex items-center gap-3 pb-1">
          {result.phonetic ? <p className="text-lg text-muted">{result.phonetic}</p> : null}
          {result.audio ? <Pronounce src={result.audio} word={result.word} /> : null}
        </div>
      </div>

      {result.meanings.length > 0 ? (
        <div className="mt-8 flex flex-col gap-6">
          {result.meanings.map((meaning) => (
            <section key={meaning.partOfSpeech}>
              <h2 className="text-sm font-semibold tracking-widest text-oxide uppercase">
                {meaning.partOfSpeech}
              </h2>
              <ol className="mt-3 flex flex-col gap-4">
                {meaning.senses.map((sense, index) => {
                  const gloss = splitGloss(sense.definition);
                  return (
                    <li key={`${meaning.partOfSpeech}-${index}`} className="flex gap-3">
                      <span className="font-display text-lg text-oxide">{index + 1}</span>
                      <div className="min-w-0">
                        {gloss.note ? <p className="text-sm text-muted">{gloss.note}</p> : null}
                        <p className="font-display text-lg leading-relaxed text-ink">{gloss.text}</p>
                        {sense.example ? (
                          <p className="mt-1 font-display text-base leading-relaxed text-muted italic">
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
        <p className="mt-8 text-muted">No short definition was found. The origin is below.</p>
      )}

      <section className="mt-8 border-l-4 border-oxide bg-paper px-5 py-5">
        <h2 className="text-sm font-semibold tracking-widest text-oxide uppercase">Origin</h2>
        {result.etymologies.length > 0 ? (
          <div className="mt-3 flex flex-col gap-4">
            {result.etymologies.map((block, index) => (
              <div key={block.paragraphs[0]?.slice(0, 48) ?? block.label}>
                {index > 0 ? <h3 className="text-sm font-semibold text-muted">Another origin</h3> : null}
                {block.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="mt-2 text-base leading-relaxed text-ink">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 font-display text-lg leading-relaxed text-ink">{result.etymologyNote}</p>
        )}
        <a
          className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-oxide underline-offset-4 hover:underline"
          href={result.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Read the full entry
        </a>
      </section>

      {result.synonyms.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold tracking-widest text-muted uppercase">Related</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.synonyms.map((word) => (
              <Button key={word} variant="quiet" size="sm" onClick={() => onSearch(word)}>
                {word}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {result.antonyms.length > 0 ? (
        <p className="mt-4 text-sm text-muted">Opposite: {result.antonyms.join(", ")}</p>
      ) : null}
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
    <article className="border border-line bg-sheet px-5 py-8 sm:px-8">
      <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Nothing turned up</h1>
      <p className="mt-3 max-w-xl font-display text-lg leading-relaxed text-muted">{copy}</p>
      {result.reason === "busy" || result.reason === "failed" ? (
        <Button className="mt-6" onClick={() => onSearch(result.word)}>
          Try again
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
