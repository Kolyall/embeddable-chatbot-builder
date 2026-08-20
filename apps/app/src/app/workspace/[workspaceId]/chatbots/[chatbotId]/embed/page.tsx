import { headers } from "next/headers";
import Link from "next/link";
import { PLAN_LIMITS } from "@cbb/db";
import { Button, Card, CardContent } from "@cbb/ui";
import { ExternalLink, Lock } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { CopyEmbedSnippet } from "./copy-embed-snippet";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ workspaceId: string; chatbotId: string }>;
}) {
  const { workspaceId, chatbotId } = await params;
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  if (!PLAN_LIMITS[workspace.plan].widgetEmbedAllowed) {
    return (
      <div>
        <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">Embed</h1>
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Lock className="size-4.5" />
            </span>
            <div>
              <p className="font-medium text-foreground">Embedding is a Pro feature</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade to Pro to embed this chatbot as a widget on your own website. On Free,
                {" " + chatbot.name} is available in-app only.
              </p>
            </div>
            <Button asChild size="sm" className="mt-1">
              <Link href={`/workspace/${workspace.id}/billing`}>Upgrade to Pro</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3001";
  const proto =
    hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const snippet = `<script src="${origin}${BASE_PATH}/widget-loader.js" data-chatbot-id="${chatbot.id}"></script>`;
  const previewUrl = `${BASE_PATH}/widget/${chatbot.id}`;

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 font-display text-2xl font-semibold text-foreground">Embed</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Paste this snippet just before the closing <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">&lt;/body&gt;</code> tag
        on your site. It renders a floating chat button in the corner of the page.
      </p>

      <CopyEmbedSnippet snippet={snippet} />

      <div className="mt-4 flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <a href={previewUrl} target="_blank" rel="noreferrer">
            <ExternalLink /> Preview the widget
          </a>
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Anyone who has this snippet can chat with {chatbot.name} from any website — there&apos;s no
        per-domain allowlist. Requests are rate-limited per chatbot to prevent abuse.
      </p>
    </div>
  );
}
