"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";

/** Upload a .dump (e.g. from a USB copy) into the backup folder, with progress. */
export function UploadForm() {
  const locale = useLocale();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function upload() {
    const file = input.current?.files?.[0];
    if (!file) {
      setMessage({ ok: false, text: t(locale, "Choose a backup file (.dump).") });
      return;
    }
    const body = new FormData();
    body.set("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/backup-upload");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setProgress(null);
      let reply: { name?: string; message?: string } = {};
      try {
        reply = JSON.parse(request.responseText) as typeof reply;
      } catch {
        // not JSON (e.g. nginx refused it)
      }
      if (request.status === 201) {
        setMessage({ ok: true, text: `${t(locale, "Uploaded as")} ${reply.name}` });
        if (input.current) input.current.value = "";
        router.refresh();
      } else if (request.status === 413) {
        setMessage({ ok: false, text: t(locale, "The file is too large.") });
      } else {
        setMessage({ ok: false, text: t(locale, reply.message ?? "The upload failed.") });
      }
    };
    request.onerror = () => {
      setProgress(null);
      setMessage({ ok: false, text: t(locale, "The upload failed.") });
    };
    setMessage(null);
    setProgress(0);
    request.send(body);
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input ref={input} type="file" accept=".dump" className="max-w-xs" disabled={progress !== null} />
        <Button type="button" variant="outline" onClick={upload} disabled={progress !== null}>
          {progress !== null ? `${t(locale, "Uploading…")} ${progress}%` : t(locale, "Upload")}
        </Button>
      </div>
      {message ? <p className={message.ok ? "text-green-700 text-sm dark:text-green-400" : "text-destructive text-sm"}>{message.text}</p> : null}
    </div>
  );
}
