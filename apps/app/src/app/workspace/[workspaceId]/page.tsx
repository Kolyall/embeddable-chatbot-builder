import Link from "next/link";
import { getDb, chatbots as chatbotsTable, PLAN_LIMITS } from "@cbb/db";
import { eq } from "drizzle-orm";
import { Badge, Button, ParrotMark } from "@cbb/ui";
import { ArrowRight, Bot, Plus } from "lucide-react";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedWorkspace } from "@/lib/workspace-access";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUserOrRedirect();
  const workspace = await getOwnedWorkspace(workspaceId, user.id);

  const db = getDb();
  const bots = await db
    .select()
    .from(chatbotsTable)
    .where(eq(chatbotsTable.workspaceId, workspace.id));

  const limits = PLAN_LIMITS[workspace.plan];
  const atLimit = bots.length >= limits.maxChatbots;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Chatbots</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bots.length} / {limits.maxChatbots === Infinity ? "∞" : limits.maxChatbots} chatbots on
            the {workspace.plan === "pro" ? "Pro" : "Free"} plan
          </p>
        </div>
        {atLimit ? (
          <Button disabled title={`Upgrade to Pro for up to ${PLAN_LIMITS.pro.maxChatbots} chatbots.`}>
            <Plus /> Create chatbot
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/workspace/${workspace.id}/chatbots/new`}>
              <Plus /> Create chatbot
            </Link>
          </Button>
        )}
      </div>

      {atLimit && (
        <p className="mb-6 text-sm text-muted-foreground">
          You&apos;ve reached the chatbot limit for your plan.{" "}
          <Link href={`/workspace/${workspace.id}/billing`} className="font-medium text-primary hover:underline">
            Upgrade to Pro
          </Link>{" "}
          for up to {PLAN_LIMITS.pro.maxChatbots} chatbots.
        </p>
      )}

      {bots.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
          <ParrotMark size={36} />
          <p className="font-display font-semibold text-foreground">No chatbots yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first chatbot, then upload documents so it has something to answer questions
            from.
          </p>
          {!atLimit && (
            <Button asChild className="mt-2">
              <Link href={`/workspace/${workspace.id}/chatbots/new`}>Create your first chatbot</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bots.map((bot) => (
            <li key={bot.id}>
              <Link
                href={`/workspace/${workspace.id}/chatbots/${bot.id}/settings`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{bot.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bot.chatProviderType ? (
                        <>
                          Chat: {bot.chatProviderType} · Embeddings: {bot.embeddingProvider}
                        </>
                      ) : (
                        <Badge tone="warning" className="mt-0.5">
                          Needs setup
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
