"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useLocale } from "@/components/locale-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { t, type Locale } from "@/lib/i18n";

/** The app's one date, time and date-time picker. Values are plain strings like the
 * native inputs ("2026-10-07", "13:30", "2026-10-07T13:30"), submitted under `name`.
 * Uncontrolled (`defaultValue`) or controlled (`value` + `onValueChange`). */

type Common = {
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  locale?: Locale;
};

const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

function todayIso() {
  const now = new Date();
  return iso(now.getFullYear(), now.getMonth(), now.getDate());
}

function useValue(defaultValue: string, controlled: string | undefined, onValueChange?: (value: string) => void) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const set = (next: string) => {
    if (controlled === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return [value, set] as const;
}

function Hidden({ name, value, required, onInvalid }: { name?: string; value: string; required?: boolean; onInvalid: () => void }) {
  if (!name) return null;
  return <input className="sr-only" tabIndex={-1} name={name} value={value} required={required} onChange={() => undefined} onInvalid={onInvalid} />;
}

function Trigger({
  id,
  disabled,
  className,
  icon,
  label,
  placeholder,
}: {
  id?: string;
  disabled?: boolean;
  className?: string;
  icon: React.ReactNode;
  label: string;
  placeholder: string;
}) {
  return (
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" disabled={disabled} className={`h-8 w-full justify-between gap-2 px-2.5 font-normal tabular-nums ${className ?? ""}`}>
        <span className={`truncate ${label ? "" : "text-muted-foreground"}`}>{label || placeholder}</span>
        <span className="text-muted-foreground">{icon}</span>
      </Button>
    </PopoverTrigger>
  );
}

/** A month grid, Monday first; days outside `min`..`max` cannot be picked. The title
 * switches to a month grid, then a year grid, for dates far away (birthdays). */
function Calendar({
  value,
  min,
  max,
  locale,
  onPick,
}: {
  value: string;
  min?: string;
  max?: string;
  locale: Locale;
  onPick: (value: string) => void;
}) {
  const today = todayIso();
  const start = valid(value) ? value : today;
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 });
  const [mode, setMode] = useState<"days" | "months" | "years">("days");
  const tag = locale === "ko" ? "ko-KR" : "en-US";
  const first = new Date(view.year, view.month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(view.year, view.month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => {
    const date = new Date(view.year, view.month, i - lead + 1);
    return { day: date.getDate(), value: iso(date.getFullYear(), date.getMonth(), date.getDate()), inMonth: date.getMonth() === view.month };
  });
  const decade = view.year - (view.year % 12);
  const title =
    mode === "days"
      ? new Intl.DateTimeFormat(tag, { year: "numeric", month: "long" }).format(first)
      : mode === "months"
        ? String(view.year)
        : `${decade} – ${decade + 11}`;
  const move = (by: number) => {
    if (mode === "years") return setView({ ...view, year: view.year + by * 12 });
    if (mode === "months") return setView({ ...view, year: view.year + by });
    const next = new Date(view.year, view.month + by, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };
  const allowed = (day: string) => (!min || day >= min) && (!max || day <= max);
  const tile = (active: boolean) =>
    `rounded-md py-2 text-sm tabular-nums transition-colors ${active ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"}`;

  return (
    <div className="grid w-64 gap-2">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => move(-1)} aria-label={t(locale, "Previous")}>
          <ChevronLeft />
        </Button>
        <button
          type="button"
          className="rounded-md px-2 py-1 font-medium text-sm hover:bg-muted disabled:pointer-events-none"
          disabled={mode === "years"}
          onClick={() => setMode(mode === "days" ? "months" : "years")}
        >
          {title}
        </button>
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => move(1)} aria-label={t(locale, "Next")}>
          <ChevronRight />
        </Button>
      </div>
      {mode === "years" ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => decade + i).map((year) => (
            <button key={year} type="button" className={tile(year === view.year)} onClick={() => (setView({ ...view, year }), setMode("months"))}>
              {year}
            </button>
          ))}
        </div>
      ) : mode === "months" ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, month) => (
            <button key={month} type="button" className={tile(month === view.month)} onClick={() => (setView({ ...view, month }), setMode("days"))}>
              {new Intl.DateTimeFormat(tag, { month: "short" }).format(new Date(2000, month, 1))}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEK.map((day) => (
            <span key={day} className="py-1 text-muted-foreground text-xs">
              {t(locale, day)}
            </span>
          ))}
          {cells.map((cell) => {
            const chosen = cell.value === value;
            const isToday = cell.value === today;
            return (
              <button
                key={cell.value}
                type="button"
                disabled={!allowed(cell.value)}
                onClick={() => onPick(cell.value)}
                className={`flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-30 ${
                  chosen
                    ? "bg-primary font-semibold text-primary-foreground"
                    : `${cell.inMonth ? "" : "text-muted-foreground/50"} ${isToday ? "font-semibold text-primary ring-1 ring-primary/50" : ""} hover:bg-muted`
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Footer({ locale, onClear, onToday, todayLabel = "Today" }: { locale: Locale; onClear?: () => void; onToday: () => void; todayLabel?: string }) {
  return (
    <div className="flex items-center justify-between border-t pt-2">
      {onClear ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          {t(locale, "Clear")}
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={onToday}>
        {t(locale, todayLabel)}
      </Button>
    </div>
  );
}

export function DatePicker({
  min,
  max,
  placeholder = "Pick a date",
  defaultValue = "",
  value: controlled,
  onValueChange,
  locale: given,
  ...props
}: Common & { min?: string; max?: string }) {
  const context = useLocale();
  const locale = given ?? context;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useValue(defaultValue, controlled, onValueChange);
  const pick = (next: string) => {
    setValue(next);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Hidden name={props.name} value={value} required={props.required} onInvalid={() => setOpen(true)} />
      <Trigger {...props} icon={<CalendarDays className="size-3.5" />} label={value} placeholder={t(locale, placeholder)} />
      <PopoverContent align="start" className="w-auto gap-2 p-2">
        <Calendar key={open ? value : ""} value={value} min={min} max={max} locale={locale} onPick={pick} />
        <Footer
          locale={locale}
          onClear={props.required ? undefined : () => pick("")}
          onToday={() => {
            const today = todayIso();
            if ((!min || today >= min) && (!max || today <= max)) pick(today);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function TimeColumns({ value, step, onPick }: { value: string; step: number; onPick: (value: string) => void }) {
  const [hour, minute] = /^\d{2}:\d{2}/.test(value) ? [value.slice(0, 2), value.slice(3, 5)] : ["", ""];
  const minutes = Array.from({ length: 60 / step }, (_, i) => pad(i * step));
  if (minute && !minutes.includes(minute)) minutes.push(minute);
  minutes.sort();
  const column = (items: string[], current: string, onClick: (item: string) => void) => (
    <div className="flex max-h-56 w-14 flex-col gap-0.5 overflow-y-auto pr-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          ref={item === current ? (node) => node?.scrollIntoView({ block: "center" }) : undefined}
          onClick={() => onClick(item)}
          className={`rounded-md py-1 text-sm tabular-nums transition-colors ${item === current ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
  return (
    <div className="flex gap-1">
      {column(Array.from({ length: 24 }, (_, i) => pad(i)), hour, (h) => onPick(`${h}:${minute || "00"}`))}
      {column(minutes, minute, (m) => onPick(`${hour || "00"}:${m}`))}
    </div>
  );
}

export function TimePicker({
  step = 5,
  placeholder = "Pick a time",
  defaultValue = "",
  value: controlled,
  onValueChange,
  locale: given,
  ...props
}: Common & { step?: number }) {
  const context = useLocale();
  const locale = given ?? context;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useValue(defaultValue.slice(0, 5), controlled?.slice(0, 5), onValueChange);
  const now = () => {
    const date = new Date();
    return `${pad(date.getHours())}:${pad(Math.floor(date.getMinutes() / step) * step)}`;
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Hidden name={props.name} value={value} required={props.required} onInvalid={() => setOpen(true)} />
      <Trigger {...props} icon={<Clock className="size-3.5" />} label={value} placeholder={t(locale, placeholder)} />
      <PopoverContent align="start" className="w-auto gap-2 p-2">
        <TimeColumns value={value} step={step} onPick={setValue} />
        <Footer locale={locale} onClear={props.required ? undefined : () => setValue("")} onToday={() => setValue(now())} todayLabel="Now" />
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  min,
  max,
  step = 5,
  placeholder = "Pick a date and time",
  defaultValue = "",
  value: controlled,
  onValueChange,
  locale: given,
  ...props
}: Common & { min?: string; max?: string; step?: number }) {
  const context = useLocale();
  const locale = given ?? context;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useValue(defaultValue.slice(0, 16), controlled?.slice(0, 16), onValueChange);
  const day = value.slice(0, 10);
  const time = value.slice(11, 16);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Hidden name={props.name} value={value} required={props.required} onInvalid={() => setOpen(true)} />
      <Trigger {...props} icon={<CalendarDays className="size-3.5" />} label={value.replace("T", " ")} placeholder={t(locale, placeholder)} />
      <PopoverContent align="start" className="w-auto gap-2 p-2">
        <div className="flex gap-3">
          <Calendar key={open ? day : ""} value={day} min={min?.slice(0, 10)} max={max?.slice(0, 10)} locale={locale} onPick={(next) => setValue(`${next}T${time || "09:00"}`)} />
          <div className="border-l pl-2">
            <TimeColumns value={time} step={step} onPick={(next) => setValue(`${day || todayIso()}T${next}`)} />
          </div>
        </div>
        <Footer
          locale={locale}
          onClear={props.required ? undefined : () => setValue("")}
          onToday={() => {
            const date = new Date();
            setValue(`${todayIso()}T${pad(date.getHours())}:${pad(Math.floor(date.getMinutes() / step) * step)}`);
          }}
          todayLabel="Now"
        />
        <Button type="button" size="sm" onClick={() => setOpen(false)}>
          {t(locale, "Done")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
