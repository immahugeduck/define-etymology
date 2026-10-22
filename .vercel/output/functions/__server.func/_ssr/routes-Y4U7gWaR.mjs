import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, p as useRouterState, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Search, c as ArrowUpRight, i as Share2, l as ArrowRight, o as Check, r as Sparkles, s as BookOpen, t as Volume2 } from "../_libs/lucide-react.mjs";
import { i as suggestWords, n as Route$1, r as SAMPLE_WORDS } from "./router-D_wcNYam.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Y4U7gWaR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-xl font-sans font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50", {
	variants: {
		variant: {
			primary: "bg-oxide text-oxide-ink hover:bg-ink",
			quiet: "border border-line bg-sheet text-ink hover:border-oxide hover:text-oxide"
		},
		size: {
			md: "h-11 px-4 text-base",
			sm: "h-11 px-3 text-sm"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var statusPromise = null;
function getAiStatus() {
	statusPromise ??= fetch("/api/ai/status", { headers: { accept: "application/json" } }).then((res) => res.ok ? res.json() : {
		available: false,
		model: null
	}).catch(() => {
		statusPromise = null;
		return {
			available: false,
			model: null
		};
	});
	return statusPromise;
}
async function post(action, body) {
	const res = await fetch(`/api/ai/${action}`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			accept: "application/json"
		},
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => null);
	if (!res.ok || !data) throw new Error(data?.message || "Grok couldn't answer just now.");
	return data;
}
var exampleCache = /* @__PURE__ */ new Map();
function fetchAiExample(input) {
	const key = `${input.word}|${input.definition}`.toLowerCase();
	let pending = exampleCache.get(key);
	if (!pending) {
		pending = post("example", input);
		pending.catch(() => exampleCache.delete(key));
		exampleCache.set(key, pending);
	}
	return pending;
}
function fetchContext(input) {
	return post("context", input);
}
var RECENT_KEY = "etymon.recent";
function DictionaryApp({ result, daily, query, isLoading, onSearch }) {
	const listId = (0, import_react.useId)();
	const [draft, setDraft] = (0, import_react.useState)(query);
	const [suggestions, setSuggestions] = (0, import_react.useState)([]);
	const [active, setActive] = (0, import_react.useState)(-1);
	const [recent, setRecent] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		setDraft(query);
		setSuggestions([]);
		setActive(-1);
	}, [query]);
	(0, import_react.useEffect)(() => {
		setRecent(readRecent());
	}, []);
	(0, import_react.useEffect)(() => {
		if (!daily && result.ok) setRecent(remember(result.word));
	}, [daily, result]);
	(0, import_react.useEffect)(() => {
		const q = draft.trim();
		if (q.length < 2 || q.toLowerCase() === query.trim().toLowerCase()) {
			setSuggestions([]);
			return;
		}
		let cancelled = false;
		const timer = setTimeout(() => {
			suggestWords({ data: { q } }).then((words) => {
				if (!cancelled) {
					setSuggestions(words);
					setActive(-1);
				}
			}).catch(() => {
				if (!cancelled) setSuggestions([]);
			});
		}, 220);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [draft, query]);
	function submit(word) {
		const next = word.trim().replace(/\s+/g, " ");
		if (!next) return;
		setSuggestions([]);
		onSearch(next);
	}
	const showSuggest = suggestions.length > 0 && draft.trim().toLowerCase() !== query.trim().toLowerCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-paper text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-5xl flex-col px-5 pb-12 sm:px-8 lg:px-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between border-b border-line py-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/",
						"aria-label": "Etymon home",
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-10 items-center justify-center rounded-xl bg-oxide text-oxide-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
								className: "size-5",
								"aria-hidden": "true"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-display text-2xl font-semibold tracking-tight text-ink",
							children: ["Etymon", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-oxide",
								children: "."
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-sm font-medium text-muted sm:block",
						children: "A field guide to word origins"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto flex w-full max-w-3xl flex-col pt-12 sm:pt-16 lg:pt-20",
					"aria-label": "Word search",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-4 text-xs font-bold tracking-[0.18em] text-oxide uppercase",
							children: "The word archive"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "max-w-2xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-ink sm:text-6xl lg:text-7xl",
							children: "Every word has a past."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 max-w-xl text-lg leading-relaxed text-muted",
							children: "Follow the trail from today's meaning back to where it all began."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "relative mt-8",
							onSubmit: (event) => {
								event.preventDefault();
								submit((active >= 0 ? suggestions[active] : draft) ?? draft);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "lookup",
									className: "sr-only",
									children: "Look up a word"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 rounded-2xl border border-line bg-sheet p-2 shadow-[0_12px_32px_-24px_var(--color-ink)] transition focus-within:border-oxide focus-within:ring-2 focus-within:ring-oxide/15",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
											className: "ml-3 size-5 shrink-0 text-muted",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "lookup",
											name: "q",
											value: draft,
											role: "combobox",
											"aria-autocomplete": "list",
											"aria-expanded": showSuggest,
											"aria-controls": listId,
											"aria-activedescendant": active >= 0 ? `${listId}-option-${active}` : void 0,
											autoCapitalize: "off",
											autoCorrect: "off",
											spellCheck: false,
											enterKeyHint: "search",
											placeholder: "Search a word…",
											className: "h-12 min-w-0 flex-1 bg-transparent font-sans text-lg text-ink outline-none placeholder:text-muted",
											onChange: (event) => setDraft(event.target.value),
											onKeyDown: (event) => {
												if (!showSuggest) return;
												if (event.key === "ArrowDown") {
													event.preventDefault();
													setActive((index) => (index + 1) % suggestions.length);
												} else if (event.key === "ArrowUp") {
													event.preventDefault();
													setActive((index) => index <= 0 ? suggestions.length - 1 : index - 1);
												} else if (event.key === "Escape") {
													setSuggestions([]);
													setActive(-1);
												}
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "submit",
											className: "shrink-0 rounded-xl px-5",
											children: ["Explore", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
												className: "size-4",
												"aria-hidden": "true"
											})]
										})
									]
								}),
								showSuggest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									id: listId,
									role: "listbox",
									className: "absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-line bg-sheet p-1 shadow-lg",
									children: suggestions.map((word, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										id: `${listId}-option-${index}`,
										type: "button",
										role: "option",
										"aria-selected": index === active,
										className: index === active ? "flex h-11 w-full items-center rounded-lg px-3 text-left font-medium text-oxide" : "flex h-11 w-full items-center rounded-lg px-3 text-left text-ink hover:bg-paper",
										onMouseDown: (event) => event.preventDefault(),
										onClick: () => submit(word),
										children: word
									}) }, word))
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "Search any word, then explore its definition and roots."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-col gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipRow, {
								label: "Start exploring",
								words: SAMPLE_WORDS.slice(0, 6),
								onPick: submit
							}), recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipRow, {
								label: "Recently viewed",
								words: recent,
								onPick: submit
							}) : null]
						})
					]
				}),
				isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-10 w-full max-w-3xl text-sm font-medium text-muted",
					role: "status",
					children: "Following the trail…"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mx-auto mt-10 w-full max-w-3xl",
					"aria-live": "polite",
					"aria-busy": isLoading,
					children: result.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Entry, {
						result,
						daily,
						onSearch: submit
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Miss, {
						result,
						onSearch: submit
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "mx-auto mt-12 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Definitions: ",
							result.ok ? result.dictionarySource : "Wiktionary, Free Dictionary API",
							" · Related words: ",
							result.ok ? result.thesaurusSource : "Merriam-Webster"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Origins: ",
							result.ok ? result.etymologySource : "Wiktionary",
							result.ok && result.etymologySource.startsWith("Wiktionary") ? ", shared under CC BY-SA." : "."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-full text-xs",
							children: "Suggestions and rhymes by Datamuse. Items marked AI are written by Grok (xAI)."
						})
					]
				})
			]
		})
	});
}
function ChipRow({ label, words, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 text-sm font-semibold text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "no-scrollbar flex min-w-0 gap-2 overflow-x-auto pb-1",
			children: words.map((word) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "quiet",
				size: "sm",
				className: "shrink-0 rounded-full bg-transparent",
				onClick: () => onPick(word),
				children: word
			}, `${label}-${word}`))
		})]
	});
}
function flattenSenses(result) {
	return [...result.meanings, ...result.root?.meanings ?? []].flatMap((meaning) => meaning.senses.map((sense) => ({
		partOfSpeech: meaning.partOfSpeech,
		definition: sense.definition
	})));
}
function useAiAvailable() {
	const [available, setAvailable] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let live = true;
		getAiStatus().then((status) => {
			if (live) setAvailable(status.available);
		});
		return () => {
			live = false;
		};
	}, []);
	return available;
}
function Entry({ result, daily, onSearch }) {
	const ai = useAiAvailable();
	const [context, setContext] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => setContext(null), [result.word]);
	const flat = flattenSenses(result);
	const highlight = context?.bestSense ?? null;
	const ownCount = result.meanings.reduce((sum, meaning) => sum + meaning.senses.length, 0);
	const hasInlineExample = [...result.meanings, ...result.root?.meanings ?? []].some((meaning) => meaning.senses.some((sense) => Boolean(sense.example)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-2xl border border-line bg-sheet shadow-[0_16px_48px_-36px_var(--color-ink)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-line px-5 py-7 sm:px-8 sm:py-9",
			children: [
				daily ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-oxide uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "size-2 rounded-full bg-oxide",
						"aria-hidden": "true"
					}), "Word of the day"]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "max-w-full min-w-0 font-display text-5xl leading-tight font-medium tracking-tight break-words text-ink sm:text-6xl",
						children: result.word
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 pb-1",
						children: [
							result.phonetic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-base text-muted",
								children: result.phonetic
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pronounce, {
								src: result.audio,
								word: result.word
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareButton, { word: result.word })
						]
					})]
				}),
				result.formOf ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-base leading-relaxed text-muted",
					children: [
						result.formOf.relation,
						" of",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `/?q=${encodeURIComponent(result.formOf.lemma)}`,
							className: "font-semibold text-oxide underline underline-offset-4",
							onClick: (event) => {
								event.preventDefault();
								onSearch(result.formOf.lemma);
							},
							children: result.formOf.lemma
						}),
						result.root ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ". Its definitions are shown below." }) : null
					]
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-5 py-7 sm:px-8 sm:py-8",
			children: [
				result.meanings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeaningList, {
					meanings: result.meanings,
					offset: 0,
					highlight
				}) : !result.root ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-base leading-relaxed text-muted",
					children: "No short definition was found. The origin is below."
				}) : null,
				result.root ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: result.meanings.length > 0 ? "mt-9 border-t border-line pt-7" : "",
					"aria-label": `Definitions of ${result.root.word}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Definitions of the root word"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "mt-1 mb-5 flex flex-wrap items-baseline gap-x-3 font-display text-3xl font-medium tracking-tight text-ink",
							children: [result.root.word, result.root.phonetic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm font-normal text-muted",
								children: result.root.phonetic
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeaningList, {
							meanings: result.root.meanings,
							offset: ownCount,
							highlight
						})
					]
				}) : null,
				!hasInlineExample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExampleBlock, {
					result,
					ai
				}) : null,
				ai ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContextBox, {
					word: result.word,
					senses: flat,
					hint: "Paste the sentence it's in and Grok will pick the meaning that fits.",
					onResult: setContext
				}) : null,
				context ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContextResult, {
					result: context,
					senses: flat,
					onSearch
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 rounded-xl bg-paper p-5 sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xs font-bold tracking-[0.16em] text-oxide uppercase",
								children: "The origin"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
								className: "size-4 text-oxide",
								"aria-hidden": "true"
							})]
						}),
						result.etymologies.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-col gap-4",
							children: [result.etymologyNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: result.etymologyNote
							}) : null, result.etymologies.map((block, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [index > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-sm font-semibold text-muted",
								children: "Another origin"
							}) : null, block.paragraphs.map((paragraph) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-base leading-relaxed break-words text-ink",
								children: paragraph
							}, paragraph.slice(0, 48)))] }, block.paragraphs[0]?.slice(0, 48) ?? block.label))]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-base leading-relaxed text-ink",
							children: result.etymologyNote
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							className: "mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-oxide underline-offset-4 hover:underline",
							href: result.sourceUrl,
							target: "_blank",
							rel: "noreferrer",
							children: ["Read the full entry", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, {
								className: "size-4",
								"aria-hidden": "true"
							})]
						})
					]
				}),
				result.synonyms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WordChips, {
					label: "Related words",
					words: result.synonyms,
					onSearch
				}) : null,
				result.rhymes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WordChips, {
					label: "Rhymes",
					words: result.rhymes,
					onSearch
				}) : null,
				result.antonyms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-5 text-sm leading-relaxed text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-ink",
							children: "Opposite:"
						}),
						" ",
						result.antonyms.join(", ")
					]
				}) : null
			]
		})]
	});
}
function WordChips({ label, words, onSearch }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-7",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-xs font-bold tracking-[0.16em] text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 flex flex-wrap gap-2",
			children: words.map((word) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "quiet",
				size: "sm",
				className: "max-w-full rounded-full",
				onClick: () => onSearch(word),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: word
				})
			}, `${label}-${word}`))
		})]
	});
}
function MeaningList({ meanings, offset, highlight }) {
	let flatIndex = offset;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-8",
		children: meanings.map((meaning) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-xs font-bold tracking-[0.16em] text-oxide uppercase",
			children: meaning.partOfSpeech
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 flex flex-col gap-5",
			children: meaning.senses.map((sense, index) => {
				const gloss = splitGloss(sense.definition);
				const isBest = highlight === flatIndex++;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: isBest ? "-mx-3 flex gap-4 rounded-xl bg-oxide/8 p-3 ring-1 ring-oxide/30" : "flex gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-sm font-medium text-oxide",
						"aria-hidden": "true",
						children: index + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 pt-0.5",
						children: [
							isBest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1 text-xs font-bold tracking-[0.12em] text-oxide uppercase",
								children: "Best match for your sentence"
							}) : null,
							gloss.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-muted",
								children: gloss.note
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base leading-relaxed break-words text-ink sm:text-lg",
								children: gloss.text
							}),
							sense.example ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 border-l-2 border-line pl-3 text-base leading-relaxed break-words text-muted italic",
								children: sense.example
							}) : null
						]
					})]
				}, `${meaning.partOfSpeech}-${index}`);
			})
		})] }, meaning.partOfSpeech))
	});
}
function ExampleBlock({ result, ai }) {
	const [aiExample, setAiExample] = (0, import_react.useState)(null);
	const [state, setState] = (0, import_react.useState)("idle");
	const first = result.meanings[0] ?? result.root?.meanings[0];
	const sense = first?.senses[0];
	(0, import_react.useEffect)(() => {
		if (result.example || !ai || !sense || !first) return;
		let live = true;
		setState("loading");
		fetchAiExample({
			word: result.word,
			partOfSpeech: first.partOfSpeech,
			definition: sense.definition
		}).then((res) => {
			if (!live) return;
			setAiExample({
				word: result.word,
				text: res.sentence
			});
			setState("idle");
		}).catch(() => {
			if (live) setState("error");
		});
		return () => {
			live = false;
		};
	}, [
		result.word,
		result.example,
		ai,
		sense,
		first
	]);
	if (result.example) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		"aria-label": "Example",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-xs font-bold tracking-[0.16em] text-muted uppercase",
				children: "Example"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 border-l-2 border-oxide/40 pl-3 text-base leading-relaxed break-words text-ink italic sm:text-lg",
				children: result.example.text
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 pl-3 text-xs text-muted",
				children: ["From ", result.example.source]
			})
		]
	});
	if (!ai || !sense) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		"aria-label": "Example (AI)",
		"aria-busy": state === "loading",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
			className: "flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-muted uppercase",
			children: ["Example ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full bg-paper px-2 py-0.5 tracking-normal text-oxide normal-case",
				children: "AI"
			})]
		}), state === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			role: "status",
			children: "Writing an example with Grok…"
		}) : state === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "No example is available right now."
		}) : aiExample && aiExample.word === result.word ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 border-l-2 border-line pl-3 text-base leading-relaxed break-words text-ink italic sm:text-lg",
			children: aiExample.text
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 pl-3 text-xs text-muted",
			children: "Example (AI) · written by Grok, not from a dictionary"
		})] }) : null]
	});
}
function ContextBox({ word, senses, hint, defaultOpen = false, onResult }) {
	const id = (0, import_react.useId)();
	const [open, setOpen] = (0, import_react.useState)(defaultOpen);
	const [sentence, setSentence] = (0, import_react.useState)("");
	const [state, setState] = (0, import_react.useState)("idle");
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
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
			onResult(await fetchContext({
				word,
				sentence: text,
				senses: senses.slice(0, 12)
			}));
		} catch (err) {
			onResult(null);
			setError(err instanceof Error ? err.message : "Grok couldn't answer just now.");
		} finally {
			setState("idle");
		}
	}
	if (!open) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-line px-4 text-sm font-semibold text-oxide hover:border-oxide",
		onClick: () => setOpen(true),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
			className: "size-4",
			"aria-hidden": "true"
		}), "Seen it in a sentence? Paste it for context"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8 rounded-xl border border-line p-4 sm:p-5",
		"aria-label": "Paste the sentence it's in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: id,
				className: "text-sm font-semibold text-ink",
				children: "Paste the sentence it's in"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-muted",
				children: hint
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				id,
				value: sentence,
				maxLength: 600,
				rows: 3,
				placeholder: `e.g. a sentence that uses “${word}”`,
				className: "mt-3 block w-full resize-y rounded-lg border border-line bg-paper p-3 text-base leading-relaxed text-ink outline-none placeholder:text-muted focus:border-oxide focus:ring-2 focus:ring-oxide/15",
				onChange: (event) => setSentence(event.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					className: "rounded-xl",
					disabled: state === "loading",
					onClick: () => void run(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-4",
						"aria-hidden": "true"
					}), state === "loading" ? "Reading the sentence…" : "Explain in context"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-muted",
					children: [sentence.length, "/600 · sent to Grok (xAI)"]
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-oxide",
				role: "alert",
				children: error
			}) : null
		]
	});
}
function ContextResult({ result, senses, onSearch }) {
	const best = result.bestSense != null ? senses[result.bestSense] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-5 rounded-xl border border-oxide/30 bg-paper p-5 sm:p-6",
		"aria-live": "polite",
		"aria-label": "AI-inferred from context",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.16em] text-oxide uppercase",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-3.5",
						"aria-hidden": "true"
					}),
					" AI-inferred from context",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-sheet px-2 py-0.5 tracking-normal text-muted normal-case",
						children: [result.confidence, " confidence"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-base leading-relaxed break-words text-ink sm:text-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display font-medium",
						children: result.word
					}),
					result.partOfSpeech ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [" · ", result.partOfSpeech]
					}) : null,
					result.lemma && result.lemma.toLowerCase() !== result.word.toLowerCase() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [
							" ",
							"· root",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "font-semibold text-oxide underline underline-offset-4",
								onClick: () => onSearch(result.lemma),
								children: result.lemma
							})
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-base leading-relaxed break-words text-ink",
				children: result.definition
			}),
			best ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: [
					"Closest dictionary sense (",
					best.partOfSpeech,
					"): ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink",
						children: best.definition
					})
				]
			}) : null,
			result.origin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm leading-relaxed break-words text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-ink",
						children: "Likely origin:"
					}),
					" ",
					result.origin
				]
			}) : null,
			result.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: result.note
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-xs text-muted",
				children: "Written by Grok from your sentence. Check it against a dictionary before relying on it."
			})
		]
	});
}
function Miss({ result, onSearch }) {
	const ai = useAiAvailable();
	const [context, setContext] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => setContext(null), [result.word]);
	const copy = {
		invalid: "Use a word made of letters, spaces, or hyphens.",
		missing: `No entry for “${result.word}”.${result.suggestions.length ? " Did you mean one of these?" : " Try another spelling."}`,
		busy: "The dictionary is busy. Try again in a moment.",
		failed: "The dictionary couldn’t be reached just now."
	}[result.reason];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl border border-line bg-sheet px-5 py-8 sm:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold tracking-[0.16em] text-oxide uppercase",
				children: "No entry found"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 font-display text-3xl font-medium tracking-tight text-ink",
				children: "Let's try another trail."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-base leading-relaxed break-words text-muted",
				children: copy
			}),
			result.suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				"aria-label": "Spelling suggestions",
				children: result.suggestions.map((word) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "quiet",
					size: "sm",
					className: "max-w-full rounded-full",
					onClick: () => onSearch(word),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: word
					})
				}, word))
			}) : null,
			result.reason === "busy" || result.reason === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "mt-5",
				onClick: () => onSearch(result.word),
				children: ["Try again", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
					className: "size-4",
					"aria-hidden": "true"
				})]
			}) : null,
			result.reason === "missing" || result.reason === "failed" ? ai ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContextBox, {
				word: result.word,
				senses: [],
				defaultOpen: true,
				hint: "Grok will read the sentence and suggest what the word most likely means.",
				onResult: setContext
			}), context ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContextResult, {
				result: context,
				senses: [],
				onSearch
			}) : null] }) : ai === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "Explaining a word from its sentence needs AI, which isn't set up on this site yet."
			}) : null : null
		]
	});
}
function ShareButton({ word }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-label": `Share ${word}`,
		className: "inline-flex size-11 items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-oxide hover:text-oxide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide",
		onClick: () => {
			const url = `${window.location.origin}/?w=${encodeURIComponent(word)}`;
			if (navigator.share) {
				navigator.share({
					title: `${word} — Etymon`,
					url
				}).catch(() => void 0);
				return;
			}
			navigator.clipboard?.writeText(url).then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1600);
			});
		},
		children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
			className: "size-5",
			"aria-hidden": true
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {
			className: "size-5",
			"aria-hidden": true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			"aria-live": "polite",
			children: copied ? "Link copied" : ""
		})]
	});
}
function Pronounce({ src, word }) {
	const [canSpeak, setCanSpeak] = (0, import_react.useState)(Boolean(src));
	(0, import_react.useEffect)(() => {
		if (!src) setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
		else setCanSpeak(true);
	}, [src]);
	if (!canSpeak) return null;
	const speak = () => {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(word);
		utterance.lang = "en-US";
		utterance.rate = .9;
		window.speechSynthesis.speak(utterance);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": src ? `Play pronunciation of ${word}` : `Say ${word} (device voice)`,
		title: src ? "Recorded pronunciation" : "Spoken by your device's voice",
		className: "inline-flex size-11 items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-oxide hover:text-oxide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide",
		onClick: () => {
			if (!src) return speak();
			new Audio(src).play().catch(speak);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
			className: "size-5",
			"aria-hidden": true
		})
	});
}
function splitGloss(definition) {
	const match = definition.match(/^\(([^)]{2,80})\)\s+([\s\S]+)$/);
	if (!match?.[1] || !match[2]) return {
		note: null,
		text: definition
	};
	return {
		note: match[1],
		text: match[2]
	};
}
function readRecent() {
	try {
		const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item) => typeof item === "string").slice(0, 6);
	} catch {
		return [];
	}
}
function remember(word) {
	const next = [word, ...readRecent().filter((item) => item.toLowerCase() !== word.toLowerCase())].slice(0, 6);
	localStorage.setItem(RECENT_KEY, JSON.stringify(next));
	return next;
}
function Home() {
	const { result, daily } = Route$1.useLoaderData();
	const { q } = Route$1.useSearch();
	const navigate = useNavigate();
	const isLoading = useRouterState({ select: (state) => state.status === "pending" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DictionaryApp, {
		result,
		daily,
		query: q ?? "",
		isLoading,
		onSearch: (word) => {
			navigate({
				to: "/",
				search: { q: word }
			});
		}
	});
}
//#endregion
export { Home as component };
