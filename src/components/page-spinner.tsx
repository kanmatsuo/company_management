import { AutoText } from "@/components/auto-text";
import { BrandMark } from "@/components/brand-mark";

/** Route loading state (used by every `loading.tsx`): the animated brand mark. Fades in after
 * a short delay so fast navigations don't flash it. */
export function PageSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center animate-[page-spinner-in_200ms_ease-out_150ms_both]"
    >
      <BrandMark className="size-16 text-muted-foreground" />
      <span className="sr-only"><AutoText>Loading…</AutoText></span>
    </div>
  );
}
