import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoadError({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function NoAccess({ description }: { description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No access</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
