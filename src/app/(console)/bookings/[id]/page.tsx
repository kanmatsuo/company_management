import { redirect } from "next/navigation";
import { changeBooking } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { show } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Booking = components["schemas"]["Booking"] & {
  date?: string;
  start_time?: string;
  end_time?: string;
  change_count?: number;
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/bookings");
  const loaded = await loadOne<Booking>(`/api/v1/bookings/${id}/`);
  if (!loaded.value) return <LoadError title="Booking" message={loaded.error ?? "Not found."} />;
  const booking = loaded.value;
  const date = booking.date || booking.start.slice(0, 10);
  const start = (booking.start_time || booking.start.slice(11, 16)).slice(0, 5);
  const end = (booking.end_time || booking.end.slice(11, 16)).slice(0, 5);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{booking.good_name}</h1>
        <p className="text-muted-foreground text-sm">{date} {start}–{end}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Person", value: show(booking.developer?.full_name) },
              { label: "Seller", value: show(booking.seller?.name) },
              { label: "Place", value: show(booking.location) },
              { label: "Slots", value: String(booking.slots) },
              { label: "Changes", value: String(booking.change_count ?? 0) },
              { label: "Total", value: `${booking.total} ${booking.currency}` },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Move</CardTitle>
          <CardDescription>Until it starts, move this booking to another time or another court of the same seller. The new time must cost the same. No card tap.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={changeBooking.bind(null, booking.id)}
            submitLabel="Move booking"
            fields={[
              { name: "date", label: "Date", type: "date", required: true, defaultValue: date },
              { name: "start_time", label: "Start", required: true, defaultValue: start, placeholder: "10:00" },
              { name: "end_time", label: "End", required: true, defaultValue: end, placeholder: "12:00" },
              { name: "good", label: "Other court id", placeholder: "Leave empty to keep this court" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
