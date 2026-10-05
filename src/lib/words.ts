export const SAMPLE_WORDS = [
  "serendipity",
  "salary",
  "disaster",
  "nice",
  "clue",
  "robot",
  "muscle",
  "quarantine",
  "window",
  "alphabet",
  "companion",
  "avocado",
  "nightmare",
  "whiskey",
] as const;

export function wordOfTheDay(now = new Date()): string {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  const index = ((day % SAMPLE_WORDS.length) + SAMPLE_WORDS.length) % SAMPLE_WORDS.length;
  return SAMPLE_WORDS[index] ?? SAMPLE_WORDS[0];
}
