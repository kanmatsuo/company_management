import { CircleAlert, Lock } from "lucide-react";
import { AutoText } from "@/components/auto-text";
import { Card, CardContent } from "@/components/ui/card";

function Notice({ title, message, icon: Icon }: { title: string; message: string; icon: typeof Lock }) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h1 className="font-semibold text-2xl tracking-tight">
        <AutoText>{title}</AutoText>
      </h1>
      <Card>
        <CardContent className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            <Icon className="size-4.5" />
          </span>
          <p className="pt-2 text-muted-foreground text-sm">
            <AutoText>{message}</AutoText>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** A page whose record couldn't be loaded (missing, not linked, no access to it). */
export function LoadError({ title, message }: { title: string; message: string }) {
  return <Notice title={title} message={message} icon={CircleAlert} />;
}

/** A page the account isn't allowed to open. */
export function NoAccess({ description }: { description: string }) {
  return <Notice title="No access" message={description} icon={Lock} />;
}
