import { redirect } from "next/navigation";
import { approvePayout, cancelPayout, payPayout, processingPayout, rejectPayout } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Payout = components["schemas"]["SellerPayment"];

export default async function PayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/seller-finance/payouts");
  const loaded = await loadOne<Payout>(`/api/v1/seller-finance/payouts/${id}/`);
  if (!loaded.value) return <LoadError title="Payout" message={loaded.error ?? "Not found."} />;
  const payout = loaded.value;
  const open = payout.status === "REQUESTED" || payout.status === "APPROVED" || payout.status === "PROCESSING";
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{payout.amount} {payout.currency}</h1>
        <p className="text-muted-foreground text-sm">{show(payout.seller?.name)} · {payout.status}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Note", value: show(payout.note) },
              { label: "Requested", value: showTime(payout.created_at) },
              { label: "Approved", value: showTime(payout.approved_at) },
              { label: "Processing", value: showTime(payout.processed_at) },
              { label: "Paid", value: showTime(payout.paid_at) },
              { label: "Payment reference", value: show(payout.payment_reference) },
              { label: "Rejected", value: showTime(payout.rejected_at) },
              { label: "Rejection reason", value: show(payout.rejection_reason) },
              { label: "Cancelled", value: showTime(payout.cancelled_at) },
            ]}
          />
        </CardContent>
      </Card>
      {open ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {payout.status === "REQUESTED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Approve</CardTitle>
                <CardDescription>The requester cannot approve their own payout.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={approvePayout.bind(null, payout.id)} submitLabel="Approve" fields={[]} />
              </CardContent>
            </Card>
          ) : null}
          {payout.status === "REQUESTED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Cancel</CardTitle>
                <CardDescription>Withdraw a request that has not been approved.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={cancelPayout.bind(null, payout.id)} submitLabel="Cancel" variant="outline" fields={[]} />
              </CardContent>
            </Card>
          ) : null}
          {payout.status === "APPROVED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Mark processing</CardTitle>
                <CardDescription>Optional: the transfer has started.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={processingPayout.bind(null, payout.id)} submitLabel="Mark processing" variant="outline" fields={[]} />
              </CardContent>
            </Card>
          ) : null}
          {payout.status === "APPROVED" || payout.status === "PROCESSING" ? (
            <Card>
              <CardHeader>
                <CardTitle>Pay</CardTitle>
                <CardDescription>Records that the money was handed over and debits the seller.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldForm action={payPayout.bind(null, payout.id)} submitLabel="Mark paid" fields={[{ name: "payment_reference", label: "Payment reference", required: true }]} />
              </CardContent>
            </Card>
          ) : null}
          {payout.status === "REQUESTED" || payout.status === "APPROVED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Reject</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldForm action={rejectPayout.bind(null, payout.id)} submitLabel="Reject" variant="destructive" fields={[{ name: "reason", label: "Reason", required: true }]} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
