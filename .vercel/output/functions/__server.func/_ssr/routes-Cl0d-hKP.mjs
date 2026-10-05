import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, p as useRouterState, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Volume2 } from "../_libs/lucide-react.mjs";
import { i as suggestWords, n as Route, r as SAMPLE_WORDS } from "./router-BhUb2gMf.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cl0d-hKP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-lg font-sans font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50", {
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
			className: "mx-auto flex w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-baseline justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-3xl font-medium tracking-tight text-ink",
						children: ["Etymon", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-oxide",
							children: "."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Definition and origin"
					})]
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
							className: "flex items-end gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "lookup",
								name: "q",
								value: draft,
								role: "combobox",
								"aria-autocomplete": "list",
								"aria-expanded": showSuggest,
								"aria-controls": listId,
								autoCapitalize: "off",
								autoCorrect: "off",
								spellCheck: false,
								enterKeyHint: "search",
								placeholder: "Look up a word",
								className: "h-12 min-w-0 flex-1 border-b border-line bg-transparent font-display text-2xl text-ink outline-none placeholder:text-muted focus:border-oxide",
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
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "shrink-0",
								children: "Look up"
							})]
						}),
						showSuggest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							id: listId,
							role: "listbox",
							className: "absolute z-10 mt-2 w-full border border-line bg-sheet shadow-sm",
							children: suggestions.map((word, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "option",
								"aria-selected": index === active,
								className: index === active ? "flex h-11 w-full items-center px-3 text-left text-oxide" : "flex h-11 w-full items-center px-3 text-left text-ink hover:text-oxide",
								onMouseDown: (event) => event.preventDefault(),
								onClick: () => submit(word),
								children: word
							}) }, word))
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipRow, {
					label: "Try",
					words: SAMPLE_WORDS.slice(0, 6),
					onPick: submit
				}),
				recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipRow, {
					label: "Recent",
					words: recent,
					onPick: submit
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 h-px bg-line",
					"aria-hidden": true
				}),
				isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Looking up…"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-6",
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: "mt-10 text-sm text-muted",
					children: "Entries from Wiktionary, CC BY-SA."
				})
			]
		})
	});
}
function ChipRow({ label, words, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex min-w-0 items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 text-sm text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto",
			children: words.map((word) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "quiet",
				size: "sm",
				className: "shrink-0",
				onClick: () => onPick(word),
				children: word
			}, `${label}-${word}`))
		})]
	});
}
function Entry({ result, daily, onSearch }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "border border-line bg-sheet px-5 py-6 sm:px-8 sm:py-8",
		children: [
			daily ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold tracking-widest text-oxide uppercase",
				children: "Word of the day"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-5xl font-medium tracking-tight break-words text-ink",
					children: result.word
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 pb-1",
					children: [result.phonetic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg text-muted",
						children: result.phonetic
					}) : null, result.audio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pronounce, {
						src: result.audio,
						word: result.word
					}) : null]
				})]
			}),
			result.meanings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex flex-col gap-6",
				children: result.meanings.map((meaning) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold tracking-widest text-oxide uppercase",
					children: meaning.partOfSpeech
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-3 flex flex-col gap-4",
					children: meaning.senses.map((sense, index) => {
						const gloss = splitGloss(sense.definition);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-lg text-oxide",
								children: index + 1
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									gloss.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: gloss.note
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-lg leading-relaxed text-ink",
										children: gloss.text
									}),
									sense.example ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-display text-base leading-relaxed text-muted italic",
										children: sense.example
									}) : null
								]
							})]
						}, `${meaning.partOfSpeech}-${index}`);
					})
				})] }, meaning.partOfSpeech))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-muted",
				children: "No short definition was found. The origin is below."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 border-l-4 border-oxide bg-paper px-5 py-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold tracking-widest text-oxide uppercase",
						children: "Origin"
					}),
					result.etymologies.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-col gap-4",
						children: result.etymologies.map((block, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [index > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-muted",
							children: "Another origin"
						}) : null, block.paragraphs.map((paragraph) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-base leading-relaxed text-ink",
							children: paragraph
						}, paragraph.slice(0, 48)))] }, block.paragraphs[0]?.slice(0, 48) ?? block.label))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 font-display text-lg leading-relaxed text-ink",
						children: result.etymologyNote
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "mt-4 inline-flex h-11 items-center text-sm font-semibold text-oxide underline-offset-4 hover:underline",
						href: result.sourceUrl,
						target: "_blank",
						rel: "noreferrer",
						children: "Read the full entry"
					})
				]
			}),
			result.synonyms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold tracking-widest text-muted uppercase",
					children: "Related"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: result.synonyms.map((word) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						size: "sm",
						onClick: () => onSearch(word),
						children: word
					}, word))
				})]
			}) : null,
			result.antonyms.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: ["Opposite: ", result.antonyms.join(", ")]
			}) : null
		]
	});
}
function Miss({ result, onSearch }) {
	const copy = {
		invalid: "Use a word made of letters, spaces, or hyphens.",
		missing: `No entry for “${result.word}”. Try another spelling.`,
		busy: "The dictionary is busy. Try again in a moment.",
		failed: "The dictionary couldn’t be reached just now."
	}[result.reason];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "border border-line bg-sheet px-5 py-8 sm:px-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-medium tracking-tight text-ink",
				children: "Nothing turned up"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl font-display text-lg leading-relaxed text-muted",
				children: copy
			}),
			result.reason === "busy" || result.reason === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6",
				onClick: () => onSearch(result.word),
				children: "Try again"
			}) : null
		]
	});
}
function Pronounce({ src, word }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": `Play pronunciation of ${word}`,
		className: "inline-flex size-11 items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-oxide hover:text-oxide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide",
		onClick: () => {
			new Audio(src).play().catch(() => void 0);
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
	const { result, daily } = Route.useLoaderData();
	const { q } = Route.useSearch();
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
