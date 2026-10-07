import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { can } from "@/lib/current-user";
import { DjangoError, djangoFetch } from "@/lib/django";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
import { requireSession } from "@/lib/page-data";
import { updateBackupSettings } from "@/app/(console)/mutations";
import { RunButton } from "@/app/(console)/backups/run-button";
import { When } from "@/app/(console)/backups/when";
import { KeptDatabase } from "@/app/(console)/backups/kept-database";
import { RestoreButton } from "@/app/(console)/backups/restore-button";
import { UploadForm } from "@/app/(console)/backups/upload-form";
import type { ReactNode } from "react";

type Backups = {
  health: {
    status: "ok" | "error";
    errors: string[];
    warnings: string[];
    last_dump_at: string | null;
    last_verify_ok: boolean;
    last_base_backup_at: string | null;
    offsite_copy_at: string | null;
  };
  config: {
    backup_time: string;
    keep_daily_days: number;
    keep_base_backups: number;
    offsite_dir: string;
    offsite_rsync: string;
    backup_dir: string;
  };
  running: boolean;
  last_run: { result: string | null; exit_status: number; started_at: string | null; finished_at: string | null };
  next_run: string | null;
  base_next_run: string | null;
  dumps: { name: string; bytes: number; created_at: string }[];
  base_backups: { name: string; created_at: string }[];
  log: string[];
  restore: {
    running: boolean;
    file: string | null;
    by: string | null;
    started_at: string | null;
    finished_at: string | null;
    ok: boolean | null;
    error: string | null;
    kept_database: string | null;
    log: string[];
  };
  kept_databases: string[];
};

function size(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Fact({ label, value, hint, locale }: { label: string; value: ReactNode; hint?: ReactNode; locale: Locale }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{t(locale, label)}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
        {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

export default async function BackupsPage({ searchParams }: { searchParams: Promise<{ saved?: string; restored?: string }> }) {
  const session = await requireSession();
  const locale = await getLocale();
  if (!can(session.user, "system.backup")) return <NoAccess description="Only admins can manage backups." />;
  const query = await searchParams;
  let data: Backups | null = null;
  let error: string | null = null;
  try {
    data = await djangoFetch<Backups>("/api/v1/system/backups/", { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load the backups.";
  }
  const health = data?.health;
  const config = data?.config;
  const lastRun = data?.last_run;
  const offsite = config?.offsite_dir || config?.offsite_rsync;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">{t(locale, "Backups")}</h1>
          <p className="text-muted-foreground text-sm">
            {t(locale, "The database is backed up every night and checked by restoring it. Every change is also kept continuously, for restoring to a point in time.")}
          </p>
        </div>
        {data ? <RunButton running={data.running} /> : null}
      </div>
      {error ? <p className="text-destructive text-sm">{t(locale, error)}</p> : null}
      {query.saved ? <p className="text-green-700 text-sm dark:text-green-400">{t(locale, "Saved.")}</p> : null}
      {data?.restore && (data.restore.running || (query.restored && data.restore.file)) ? (
        <Card className={data.restore.running ? "" : data.restore.ok ? "border-green-600/40" : "border-destructive/60"}>
          <CardHeader>
            <CardTitle>
              {data.restore.running
                ? t(locale, "A restore is running")
                : data.restore.ok
                  ? t(locale, "The backup was restored")
                  : t(locale, "The restore failed")}
            </CardTitle>
            <CardDescription>
              <span className="font-mono">{data.restore.file}</span>
              {data.restore.by ? ` · ${data.restore.by}` : ""} · <When value={data.restore.finished_at ?? data.restore.started_at} />
            </CardDescription>
          </CardHeader>
          {data.restore.error || data.restore.kept_database ? (
            <CardContent className="grid gap-1 text-sm">
              {data.restore.error ? <p className="text-destructive">{t(locale, data.restore.error)}</p> : null}
              {data.restore.kept_database ? (
                <p>
                  {t(locale, "The data from before the restore is kept as")} <span className="font-mono">{data.restore.kept_database}</span>
                </p>
              ) : null}
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {data && health && config && lastRun ? (
        <>
          <Card className={health.status === "ok" ? "border-green-600/40" : "border-destructive/60"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {health.status === "ok" ? t(locale, "Backups are working") : t(locale, "Backups need attention")}
                <Badge variant={health.status === "ok" ? "secondary" : "destructive"}>{health.status === "ok" ? "OK" : t(locale, "Error")}</Badge>
              </CardTitle>
              {health.errors.length || health.warnings.length ? (
                <CardDescription>
                  <ul className="list-disc pl-5">
                    {health.errors.map((item) => (
                      <li key={item} className="text-destructive">{t(locale, item)}</li>
                    ))}
                    {health.warnings.map((item) => (
                      <li key={item}>{t(locale, item)}</li>
                    ))}
                  </ul>
                </CardDescription>
              ) : null}
            </CardHeader>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Fact
              locale={locale}
              label="Last backup"
              value={data.running ? t(locale, "Running now…") : <When value={lastRun.finished_at ?? health.last_dump_at} />}
              hint={
                lastRun.result
                  ? lastRun.result === "success"
                    ? `${t(locale, "Succeeded")}${data.dumps[0] ? ` · ${size(data.dumps[0].bytes)}` : ""}`
                    : `${t(locale, "Failed")} (${lastRun.result}, ${lastRun.exit_status})`
                  : undefined
              }
            />
            <Fact
              locale={locale}
              label="Restore check"
              value={health.last_verify_ok ? t(locale, "Passed") : t(locale, "Failed")}
              hint={t(locale, "The last backup was restored into a scratch database and checked.")}
            />
            <Fact locale={locale} label="Next backup" value={<When value={data.next_run} />} hint={`${t(locale, "Every night at")} ${config.backup_time}`} />
            <Fact
              locale={locale}
              label="Off-site copy"
              value={offsite ? <When value={health.offsite_copy_at} /> : t(locale, "Not set")}
              hint={offsite || t(locale, "Backups are only on this server's disk.")}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t(locale, "Backup files")}</CardTitle>
              <CardDescription>
                {t(locale, "Nightly database backups, newest first. A downloaded file holds personal data and PIN hashes: keep it safe.")}{" "}
                <span className="font-mono">{config.backup_dir}/db</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.dumps.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t(locale, "No backups yet.")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t(locale, "Made")}</TableHead>
                      <TableHead>{t(locale, "File")}</TableHead>
                      <TableHead className="text-right">{t(locale, "Size")}</TableHead>
                      <TableHead />
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.dumps.map((file) => (
                      <TableRow key={file.name}>
                        <TableCell className="tabular-nums"><When value={file.created_at} /></TableCell>
                        <TableCell className="font-mono text-xs">
                          {file.name}
                          {file.name.startsWith("uploaded-") ? <Badge variant="outline" className="ml-2">{t(locale, "Uploaded")}</Badge> : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{size(file.bytes)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <a href={`/api/backup-file/${file.name}`} download>
                              <Download />
                              {t(locale, "Download")}
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <RestoreButton file={file.name} disabled={data.running || data.restore.running} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="mt-3 text-muted-foreground text-sm">
                {t(locale, "Point-in-time base backups")}: {data.base_backups.length}
                {data.base_backups[0] ? <> · {t(locale, "last")} <When value={data.base_backups[0].created_at} /></> : null}
                {data.base_next_run ? <> · {t(locale, "next")} <When value={data.base_next_run} /></> : null}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Settings")}</CardTitle>
                <CardDescription>
                  {t(locale, "Off-site: a mounted folder (second disk, USB disk, NAS) or another server over rsync, not both. Leave both empty for none.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm
                  action={updateBackupSettings}
                  submitLabel="Save"
                  fields={[
                    { name: "backup_time", label: "Nightly backup time (HH:MM)", defaultValue: config.backup_time, placeholder: "02:30", required: true },
                    { name: "keep_daily_days", label: "Keep nightly backups (days)", type: "number", defaultValue: String(config.keep_daily_days), required: true },
                    { name: "keep_base_backups", label: "Keep point-in-time base backups (weeks)", type: "number", defaultValue: String(config.keep_base_backups), required: true },
                    { name: "offsite_dir", label: "Off-site folder", defaultValue: config.offsite_dir, placeholder: "/mnt/backup-disk/backend" },
                    { name: "offsite_rsync", label: "Off-site server (rsync)", defaultValue: config.offsite_rsync, placeholder: "backup@10.0.0.50:/srv/backups/backend" },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Last run")}</CardTitle>
                <CardDescription>
                  <When value={lastRun.started_at} /> → <When value={lastRun.finished_at} />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">{data.log.join("\n") || "—"}</pre>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Upload a backup file")}</CardTitle>
                <CardDescription>
                  {t(locale, "A .dump made by this system (e.g. a copy on a USB stick, or from another server). It is checked, added to the list above and can then be restored.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t(locale, "Restoring")}</CardTitle>
                <CardDescription>
                  {t(locale, "Restore puts a backup back as the live data. First the current data is backed up, then the file is checked by a trial restore; only then is the live data replaced. The data from before is kept as a separate database: delete it once the restored data is fine.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.kept_databases.length ? (
                  data.kept_databases.map((name) => <KeptDatabase key={name} name={name} />)
                ) : (
                  <p className="text-muted-foreground text-sm">{t(locale, "No kept databases.")}</p>
                )}
                {data.restore.log.length ? (
                  <details>
                    <summary className="cursor-pointer text-sm">{t(locale, "Last restore log")}</summary>
                    <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">{data.restore.log.join("\n")}</pre>
                  </details>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
