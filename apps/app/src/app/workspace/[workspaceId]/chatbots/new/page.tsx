import Link from "next/link";
import { getDb, chatbots, PLAN_LIMITS } from "@cbb/db";
import { eq } from "drizzle-orm";
import { Button, ParrotMark } from "@cbb/ui";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedWorkspace } from "@/lib/workspace-access";
import { CreateChatbotForm } from "./create-chatbot-form";

export default async function NewChatbotPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUserOrRedirect();
  const workspace = await getOwnedWorkspace(workspaceId, user.id);

  const db = getDb();
  const existing = await db.select().from(chatbots).where(eq(chatbots.workspaceId, workspace.id));
  const limit = PLAN_LIMITS[workspace.plan].maxChatbots;

  // Re-checked here too (not just in the action) so a direct visit to this
  // URL after hitting the limit doesn't show a form that will only fail.
  if (existing.length >= limit) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-16 text-center">
        <ParrotMark size={32} className="opacity-70 grayscale" />
        <h1 className="font-display text-xl font-semibold text-foreground">Chatbot limit reached</h1>
        <p className="text-sm text-muted-foreground">
          The {workspace.plan === "pro" ? "Pro" : "Free"} plan is limited to {limit} chatbot
          {limit === 1 ? "" : "s"}. Upgrade to Pro for more.
        </p>
        <Button asChild className="mt-2">
          <Link href={`/workspace/${workspace.id}/billing`}>View billing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Create a chatbot</h1>
        <p className="mt-1 text-sm text-muted-foreground">You can configure its AI provider next.</p>
      </div>
      <CreateChatbotForm workspaceId={workspace.id} />
    </div>
  );
}
