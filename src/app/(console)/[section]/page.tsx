import { notFound, redirect } from "next/navigation";
import { SectionTemplate } from "@/components/section-template";
import { can, getSession } from "@/lib/current-user";

const SECTIONS: Record<string, { title: string; description: string; permission: string }> = {
  developers: {
    title: "Developers",
    description: "Directory, status, and each person's card and attendance.",
    permission: "developer.view",
  },
  cards: {
    title: "Cards",
    description: "RFID cards, assignments, and block or retire actions.",
    permission: "rfid.view",
  },
  readers: {
    title: "Readers",
    description: "Door readers and the one-time API key when a reader is created or rotated.",
    permission: "rfid.view",
  },
  scans: {
    title: "Scans",
    description: "Recent card scans, including unknown cards that can be registered.",
    permission: "rfid.view",
  },
  attendance: {
    title: "Attendance",
    description: "Daily attendance and manual corrections.",
    permission: "attendance.view",
  },
  users: {
    title: "Users",
    description: "Accounts, roles, and who can sign in.",
    permission: "user.view",
  },
  audit: {
    title: "Audit",
    description: "What changed, who changed it, and the previous and next values.",
    permission: "audit.view",
  },
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const spec = SECTIONS[section];
  if (!spec) notFound();

  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, spec.permission)) {
    return (
      <section className="rounded-xl bg-card p-6 text-card-foreground ring-1 ring-foreground/10">
        <h1 className="font-semibold text-lg">No access</h1>
        <p className="mt-2 text-muted-foreground text-sm">Your account cannot open this section.</p>
      </section>
    );
  }

  return <SectionTemplate title={spec.title} description={spec.description} />;
}
