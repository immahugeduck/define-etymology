/**
 * Form-of detection and lemma resolution.
 *   Unit:  npm run test:words
 *   Live (hits Wiktionary/Datamuse): ETYMON_LIVE=1 npm run test:words
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSense, textFormOf } from "./wiktionary-parse.ts";
import { formOfLabel, ownSenses, pickFormOf } from "./lemma.ts";
import { checkSameOrigin, RateLimiter } from "./ai/guard.server.ts";

describe("textFormOf", () => {
  const cases: [string, string, string][] = [
    ["plural of diatom", "Plural", "diatom"],
    ["Alternative form of peneplain.", "Alternative form", "peneplain"],
    ["simple past of run", "Simple past", "run"],
    ["(ran) Simple past tense of run.", "Simple past tense", "run"],
    ["comparative degree of good and well", "Comparative degree", "good"],
    ["Plural of mouse", "Plural", "mouse"],
    ["plural of goose", "Plural", "goose"],
    ["Misspelling of definitely.", "Misspelling", "definitely"],
    ["British spelling of color", "British spelling", "color"],
    ["past participle of take", "Past participle", "take"],
  ];
  for (const [text, relation, lemma] of cases) {
    it(text, () => assert.deepEqual(textFormOf(text), { relation, lemma }));
  }
  for (const text of ["A body of water", "The property or quality of being good", "Any of a group of minute algae"]) {
    it(`not a form: ${text}`, () => assert.equal(textFormOf(text), null));
  }
});

describe("parseSense (Wiktionary HTML)", () => {
  it("reads the form-of-definition link", () => {
    const html =
      '<span class="form-of-definition use-with-mention">plural of <span class="form-of-definition-link"><i class="Latn mention" lang="en"><a href="/wiki/diatom#English" title="diatom">diatom</a></i></span></span>';
    const sense = parseSense(html);
    assert.equal(sense.text, "plural of diatom");
    assert.deepEqual(sense.formOf, { relation: "Plural", lemma: "diatom" });
  });
  it("ignores non-English form-of links but keeps the usage example", () => {
    const html =
      'Healed or recovered.<dl><dd><i class="Latn mention e-example" lang="en">let\'s go when you\'re all <b>better</b>.</i></dd></dl>';
    const sense = parseSense(html);
    assert.equal(sense.text, "Healed or recovered.");
    assert.equal(sense.formOf, null);
    assert.equal(sense.example, "let's go when you're all better.");
  });
});

describe("pickFormOf", () => {
  const m = (pos: string, ...defs: string[]) => ({ partOfSpeech: pos, senses: defs.map((definition) => ({ definition })) });
  it("diatoms → diatom", () => assert.equal(pickFormOf("diatoms", [m("noun", "plural of diatom")])?.lemma, "diatom"));
  it("peneplane → peneplain", () =>
    assert.equal(pickFormOf("peneplane", [m("noun", "Alternative form of peneplain.")])?.lemma, "peneplain"));
  it("ran → run (most common lemma)", () =>
    assert.equal(pickFormOf("ran", [m("verb", "simple past of run", "simple past of rin", "past participle of run")])?.lemma, "run"));
  it("better → good (leading sense)", () =>
    assert.equal(
      pickFormOf("better", [m("adjective", "comparative degree of good and well", "Greater in amount"), m("noun", "A superior")])?.lemma,
      "good",
    ));
  it("mice → mouse", () => assert.equal(pickFormOf("mice", [m("noun", "plural of mouse")])?.lemma, "mouse"));
  it("geese → goose", () => assert.equal(pickFormOf("geese", [m("noun", "plural of goose")])?.lemma, "goose"));
  it("a root word stays put", () =>
    assert.equal(pickFormOf("colour", [m("noun", "The spectral composition of visible light.")]), null));
  it("a word that only points at itself is not followed", () =>
    assert.equal(pickFormOf("run", [m("verb", "Alternative form of run")]), null));
  it("ownSenses drops only senses pointing at the lemma", () => {
    const own = ownSenses([m("verb", "simple past of run", "simple past of rin"), m("noun", "Yarns coiled on a winch.")], "run");
    assert.deepEqual(own.map((x) => x.senses.map((s) => s.definition)), [["simple past of rin"], ["Yarns coiled on a winch."]]);
  });
  it("labels read naturally", () => assert.equal(formOfLabel({ relation: "Plural", lemma: "diatom" }), "Plural of diatom"));
});

describe("AI guard", () => {
  it("same-origin only", () => {
    assert.equal(checkSameOrigin({ origin: "https://define-etymology.vercel.app", referer: null, requestHosts: ["define-etymology.vercel.app"] }), true);
    assert.equal(checkSameOrigin({ origin: "https://evil.example", referer: null, requestHosts: ["define-etymology.vercel.app"] }), false);
    assert.equal(checkSameOrigin({ origin: null, referer: null, requestHosts: ["define-etymology.vercel.app"] }), false);
  });
  it("rate limits per key", () => {
    const limiter = new RateLimiter({ perMinute: 2, perHour: 10, globalPerHour: 100 }, () => 1_000);
    assert.equal(limiter.check("a").ok, true);
    assert.equal(limiter.check("a").ok, true);
    assert.equal(limiter.check("a").ok, false);
    assert.equal(limiter.check("b").ok, true);
  });
});

if (process.env.ETYMON_LIVE === "1") {
  describe("live lemma resolution", async () => {
    const { lookupEntry } = await import("./dictionary.ts");
    const expectRoot: [string, string][] = [
      ["diatoms", "diatom"],
      ["peneplane", "peneplain"],
      ["ran", "run"],
      ["better", "good"],
      ["mice", "mouse"],
      ["geese", "goose"],
    ];
    for (const [word, lemma] of expectRoot) {
      it(`${word} → ${lemma} with definitions and origin`, { timeout: 30_000 }, async () => {
        const result = await lookupEntry(word);
        assert.equal(result.ok, true);
        if (!result.ok) return;
        assert.equal(result.word.toLowerCase(), word);
        assert.equal(result.root?.word.toLowerCase(), lemma);
        assert.ok((result.root?.meanings.length ?? 0) > 0, "root has definitions");
        assert.ok(result.etymologies.length > 0, "origin present");
      });
    }
    it("colour has a real definition", { timeout: 30_000 }, async () => {
      const result = await lookupEntry("colour");
      assert.equal(result.ok, true);
      if (result.ok) assert.ok(result.meanings.length + (result.root?.meanings.length ?? 0) > 0);
    });
    it("peneplanez is missing, with suggestions", { timeout: 30_000 }, async () => {
      const result = await lookupEntry("peneplanez");
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "missing");
        assert.ok(result.suggestions.includes("peneplane"), result.suggestions.join(","));
      }
    });
  });
}
