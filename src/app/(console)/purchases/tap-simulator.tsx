"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simulateTap, testCards, type TestCard } from "@/app/(console)/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-context";
import { SearchSelect } from "@/components/search-select";

export function TapSimulator({ purchaseId }: { purchaseId: number }) {
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState<TestCard[]>([]);
  const [developer, setDeveloper] = useState<number | null>(null);
  const [uid, setUid] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const rows = await testCards(search.trim());
      setCards(rows);
      setDeveloper((current) =>
        rows.some((row) => row.developer === current) ? current : rows[0]?.developer ?? null,
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function tap() {
    const who = uid.trim() ? { uid: uid.trim() } : developer ? { developer } : null;
    if (!who) return setNote({ ok: false, text: "Choose a developer or enter a card UID." });
    startTransition(async () => {
      const reply = await simulateTap(purchaseId, who);
      if (!reply.ok) return setNote({ ok: false, text: reply.error });
      setNote({ ok: reply.accepted, text: `${reply.result}: ${reply.message}` });
      router.refresh();
    });
  }

  return (
    <Card className="border-dashed border-amber-500">
      <CardHeader>
        <CardTitle>Simulate tap (testing only)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="sim-search">Find a test developer</Label>
          <Input
            id="sim-search"
            placeholder="Name or employee number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="sim-developer">Developer paying</Label>
          <SearchSelect
            id="sim-developer"
            value={developer ? String(developer) : ""}
            onValueChange={(value) => setDeveloper(Number(value) || null)}
            locale={locale}
            placeholder={cards.length === 0 ? "No matching developers" : "Choose"}
            options={cards.map((card) => ({
              value: String(card.developer),
              label: `${card.full_name} (${card.employee_number}) · ${card.balance ?? "-"} · ${card.has_pin ? "PIN ✓" : "no PIN"}${card.card_status !== "ACTIVE" ? ` · card ${card.card_status}` : ""}`,
            }))}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="sim-uid">…or any card UID (e.g. an unknown card)</Label>
          <Input
            id="sim-uid"
            placeholder="04FFFFFF"
            value={uid}
            onChange={(event) => setUid(event.target.value)}
            autoComplete="off"
          />
        </div>
        <Button type="button" variant="outline" onClick={tap} disabled={pending}>
          {pending ? "Tapping…" : "Simulate tap"}
        </Button>
        {note ? (
          <p className={note.ok ? "text-sm text-emerald-600" : "text-destructive text-sm"}>{note.text}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
