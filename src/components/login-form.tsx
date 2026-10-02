"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type FieldErrors = Record<string, string[]>;

export function LoginForm({ notice, locale }: { notice?: string; locale: Locale }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(notice ?? "");
  const [fields, setFields] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setFields({});
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
        details?: FieldErrors;
      } | null;
      if (!response.ok) {
        setMessage(body?.message || t(locale, "Could not sign in."));
        setFields(body?.details ?? {});
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMessage(t(locale, "Could not reach the app."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {message ? <p className="text-destructive text-sm">{message}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="email">{t(locale, "Email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="boss@demo.local"
          aria-invalid={Boolean(fields.email)}
        />
        {fields.email?.map((error) => (
          <p key={error} className="text-destructive text-xs">
            {error}
          </p>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">{t(locale, "Password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fields.password)}
        />
        {fields.password?.map((error) => (
          <p key={error} className="text-destructive text-xs">
            {error}
          </p>
        ))}
      </div>
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? t(locale, "Signing in…") : t(locale, "Login")}
      </Button>
    </form>
  );
}
