import { redirect } from "next/navigation";
import { getDb, workspaces } from "@cbb/db";
import { eq } from "drizzle-orm";
import { ParrotMark } from "@cbb/ui";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { CreateWorkspaceForm } from "./create-workspace-form";

export default async function NewWorkspacePage() {
  const user = await requireUserOrRedirect();

  const db = getDb();
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user.id))
    .limit(1);
  if (existing) {
    redirect(`/workspace/${existing.id}`);
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <ParrotMark size={40} />
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold text-foreground">Name your workspace</h1>
          <p className="text-sm text-muted-foreground">
            One workspace holds all your chatbots. You can&apos;t change the name later.
          </p>
        </div>
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
