import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartSlot({ title, caption }: { title: string; caption: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{caption}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground text-sm">
          No chart data yet
        </div>
      </CardContent>
    </Card>
  );
}
