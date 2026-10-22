/**
 * Form-of detection: decides when a looked-up word is really an inflection or
 * variant ("plural of diatom", "Alternative form of peneplain") whose real
 * definition lives on another entry (the lemma). Pure — unit-tested in
 * src/lib/lemma.test.ts.
 */
import { textFormOf, type FormOf } from "./wiktionary-parse.ts";

export type { FormOf };

export type FormSense = { definition: string; formOf?: FormOf | null };
export type FormMeaning = { partOfSpeech: string; senses: FormSense[] };

/** The form-of a sense carries — structured (Wiktionary) first, else by text. */
export function senseFormOf(sense: FormSense): FormOf | null {
  return sense.formOf ?? textFormOf(sense.definition);
}

/**
 * Pick the lemma to follow, or null when the word is its own root.
 * Follows when the leading sense is a form-of, or when at least half the
 * senses are form-ofs (e.g. "ran": simple past of run).
 */
export function pickFormOf(word: string, meanings: FormMeaning[]): FormOf | null {
  const self = normalize(word);
  const senses = meanings.flatMap((meaning) => meaning.senses);
  if (senses.length === 0) return null;
  const forms = senses
    .map((sense) => senseFormOf(sense))
    .filter((form): form is FormOf => Boolean(form) && normalize(form!.lemma) !== self);
  if (forms.length === 0) return null;
  const lead = meanings[0]?.senses[0];
  const leadForm = lead ? senseFormOf(lead) : null;
  if (leadForm && normalize(leadForm.lemma) !== self) return leadForm;
  if (forms.length * 2 >= senses.length) {
    // Most common lemma wins ("ran" → run over rin).
    const counts = new Map<string, number>();
    for (const form of forms) counts.set(normalize(form.lemma), (counts.get(normalize(form.lemma)) ?? 0) + 1);
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return forms.find((form) => normalize(form.lemma) === best) ?? forms[0]!;
  }
  return null;
}

/** Drop the senses that just point at `lemma`; keep the word's own senses. */
export function ownSenses<M extends FormMeaning>(meanings: M[], lemma: string): M[] {
  const target = normalize(lemma);
  return meanings
    .map((meaning) => ({
      ...meaning,
      senses: meaning.senses.filter((sense) => {
        const form = senseFormOf(sense);
        return !form || normalize(form.lemma) !== target;
      }),
    }))
    .filter((meaning) => meaning.senses.length > 0);
}

/** "Plural" + "diatom" → "Plural of diatom". */
export function formOfLabel(form: FormOf): string {
  const relation = form.relation.trim();
  return `${relation[0]?.toUpperCase() ?? ""}${relation.slice(1)} of ${form.lemma}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/’/g, "'");
}
