import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { DictionaryApp } from "@/components/dictionary-app";
import { lookupWord } from "@/lib/dictionary";
import { wordOfTheDay } from "@/lib/words";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    const q = typeof search.q === "string" ? search.q.slice(0, 60).trim() : "";
    return q ? { q } : {};
  },
  loaderDeps: ({ search }: { search: { q?: string } }) => ({ q: search.q ?? "" }),
  loader: async ({ deps }) => {
    const daily = deps.q.trim().length === 0;
    const word = daily ? wordOfTheDay() : deps.q;
    const result = await lookupWord({ data: { word } });
    return { result, daily };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData?.result.ok === true ? `${loaderData.result.word} — Etymon` : "Etymon",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { result, daily } = Route.useLoaderData();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const isLoading = useRouterState({ select: (state) => state.status === "pending" });

  return (
    <DictionaryApp
      result={result}
      daily={daily}
      query={q ?? ""}
      isLoading={isLoading}
      onSearch={(word) => {
        void navigate({ to: "/", search: { q: word } });
      }}
    />
  );
}
