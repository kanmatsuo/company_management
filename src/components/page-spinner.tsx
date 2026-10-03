import { LoaderCircle } from "lucide-react";

/** Route loading state (used by every `loading.tsx`). Fades in after a short delay so fast
 * navigations don't flash it. */
export function PageSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center animate-[page-spinner-in_200ms_ease-out_150ms_both]"
    >
      <LoaderCircle aria-hidden className="size-8 text-muted-foreground motion-safe:animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
