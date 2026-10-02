import { Hint, AutoText } from "@/components/auto-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSlot } from "@/components/chart-panel";

export function SectionTemplate({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight"><AutoText>{title}</AutoText></h1>
        <Hint>{description}</Hint>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ChartSlot title="Chart" caption="This area is reserved for a chart." />
        </div>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>List</CardTitle>
            <CardDescription>Tables and filters for this section will sit here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-10 rounded-lg bg-muted" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
