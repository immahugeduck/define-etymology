import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center text-ink">
      <span className="text-oxide" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-3xl font-medium">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">{errorMessage(error)}</p>
    </main>
  );
}

export function NotFoundComponent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center text-ink">
      <p className="font-display text-3xl font-medium">
        Etymon<span className="text-oxide">.</span>
      </p>
      <h1 className="mt-6 font-display text-4xl font-medium">That page isn’t here</h1>
      <p className="mt-3 max-w-sm text-muted">This dictionary only has the lookup page.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-oxide px-4 font-sans font-semibold text-oxide-ink"
      >
        Back to lookup
      </Link>
    </main>
  );
}