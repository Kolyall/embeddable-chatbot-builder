import { PLAN_LIMITS } from "@cbb/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@cbb/ui";
import { Check, Info } from "lucide-react";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedWorkspace } from "@/lib/workspace-access";
import { setWorkspacePlan } from "./actions";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUserOrRedirect();
  const workspace = await getOwnedWorkspace(workspaceId, user.id);
  const limits = PLAN_LIMITS[workspace.plan];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">Billing</h1>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <CardTitle className="mt-0.5 text-xl">{workspace.plan === "pro" ? "Pro" : "Free"}</CardTitle>
          </div>
          <Badge tone={workspace.plan === "pro" ? "brand" : "neutral"}>
            {workspace.plan === "pro" ? "Pro" : "Free"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ul className="flex flex-col gap-2.5 text-sm text-foreground">
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-primary" />
              {limits.maxChatbots === Infinity ? "Unlimited" : limits.maxChatbots} chatbot
              {limits.maxChatbots === 1 ? "" : "s"}
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-primary" />
              {limits.maxDocumentsPerChatbot === Infinity ? "Unlimited" : limits.maxDocumentsPerChatbot}{" "}
              documents per chatbot
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-primary" />
              {limits.widgetEmbedAllowed
                ? "Embed the chat widget on other websites"
                : "In-app chat only — no embeddable widget"}
            </li>
          </ul>

          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            This is a mock billing flow — no payment is collected.
          </p>

          {workspace.plan === "free" ? (
            <form action={setWorkspacePlan.bind(null, workspace.id, "pro")}>
              <Button type="submit">Upgrade to Pro</Button>
            </form>
          ) : (
            <form action={setWorkspacePlan.bind(null, workspace.id, "free")}>
              <Button type="submit" variant="secondary">
                Downgrade to Free
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
