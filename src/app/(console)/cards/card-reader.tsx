"use client";

import { SearchSelect } from "@/components/search-select";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "@/components/app-link";
import { useLocale } from "@/components/locale-context";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

/** A card assign reader (device purpose ENROLL). */
export type Reader = { id: number; code: string; name?: string; is_online?: boolean };

export type CardRead = {
  event: number;
  uid: string;
  card: {
    id: number;
    status: string;
    label?: string;
    notes?: string;
    /** This tap registered the card. */
    new: boolean;
    assigned: boolean;
    holder: string | null;
    /** The holder (null when not assigned, or in another building for a building manager). */
    developer?: { id: number; full_name: string; employee_number: string; department: string; status: string } | null;
  } | null;
};

const POLL_MS = 1000;
const CHOSEN_KEY = "card-assign-reader";

function readChosen() {
  try {
    return window.localStorage.getItem(CHOSEN_KEY);
  } catch {
    return null;
  }
}

function subscribeChosen(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** The card assign reader the user picked (remembered in this browser, shared by the New
 * card and Assign card pages); the only reader when there is just one. */
export function useChosenReader(readers: Reader[]): [string, (id: string) => void] {
  const stored = useSyncExternalStore(subscribeChosen, readChosen, () => null);
  const [picked, setPicked] = useState<string | null>(null);
  const known = (id: string | null) => (id && readers.some((r) => String(r.id) === id) ? id : "");
  const device = picked ?? (known(stored) || (readers.length === 1 ? String(readers[0].id) : ""));
  const choose = (id: string) => {
    setPicked(id);
    try {
      window.localStorage.setItem(CHOSEN_KEY, id);
    } catch {
      // private window or blocked storage: the choice just isn't kept
    }
  };
  return [device, choose];
}

/** Polls for cards tapped on `device` after the page opened; `read` is the newest tap. */
export function useCardReader(device: string) {
  const [read, setRead] = useState<CardRead | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!device) return;
    let cursor: number | null = null;
    let stopped = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const query = new URLSearchParams({ device });
        if (cursor !== null) query.set("after", String(cursor));
        const response = await fetch(`/api/card-reads?${query}`, { cache: "no-store" });
        const body = await response.json();
        if (stopped) return;
        if (!response.ok) {
          setProblem(body.message ?? "Could not reach the card reader.");
        } else {
          setProblem(null);
          if (cursor === null) cursor = body.cursor ?? 0; // ignore taps from before the page opened
          if (body.read) {
            cursor = body.read.event;
            setRead(body.read);
          }
        }
      } catch {
        if (!stopped) setProblem("Could not reach the card reader.");
      }
      if (!stopped) timer = window.setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [device]);

  return { read, problem, clear: () => setRead(null) };
}

export function ReaderPicker({ readers, value, onChange }: { readers: Reader[]; value: string; onChange: (value: string) => void }) {
  const locale = useLocale();
  return (
    <label className="grid max-w-md gap-1.5 text-sm">
      {t(locale, "Reader")}
      <SearchSelect
        value={value}
        onValueChange={onChange}
        locale={locale}
        placeholder="Choose a reader"
        options={readers.map((reader) => ({
          value: String(reader.id),
          label: `${reader.name ? `${reader.name} · ${reader.code}` : reader.code}${reader.is_online ? "" : ` (${t(locale, "offline")})`}`,
        }))}
      />
    </label>
  );
}

/** Spinner while waiting, then the tapped UID with the card's status and holder. */
export function TapStatus({ read, problem }: { read: CardRead | null; problem: string | null }) {
  const locale = useLocale();
  const card = read?.card;
  return (
    <>
      {problem ? <p className="text-destructive text-sm">{t(locale, problem)}</p> : null}
      {read ? (
        <div className="grid gap-1 rounded-lg border p-3">
          <p className="font-mono text-lg">{read.uid}</p>
          {card ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={card.status === "ACTIVE" ? "secondary" : "outline"}>{t(locale, card.status)}</Badge>
              {card.new ? <Badge>{t(locale, "Just registered")}</Badge> : null}
              {card.assigned
                ? `${t(locale, "Already assigned to")} ${card.holder ?? t(locale, "a developer of another building")}`
                : t(locale, "Not assigned")}
              <Link href={`/cards/${card.id}`} className="underline-offset-4 hover:underline">{t(locale, "Open card")}</Link>
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">{t(locale, "Tap another card to replace it.")}</p>
        </div>
      ) : (
        <p role="status" className="flex items-center gap-2 text-muted-foreground text-sm">
          <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
          {t(locale, "Waiting for a card…")}
        </p>
      )}
    </>
  );
}
