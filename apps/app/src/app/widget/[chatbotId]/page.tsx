import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb, chatbots, workspaces } from "@cbb/db";
import { PLAN_LIMITS } from "@cbb/db";
import { isUuid } from "@/lib/is-uuid";
import { WidgetChat } from "./widget-chat";

/**
 * Public widget iframe content page — this is the document the embed
 * loader (`public/widget-loader.js`) points a third-party site's `<iframe>`
 * at. Deliberately outside `/workspace/[workspaceId]` so it does NOT inherit
 * that section's layout (owner nav, "logged in" chrome) — the root layout
 * (`src/app/layout.tsx`) is already just fonts + a bare `<html>/<body>`, so
 * it's safe to render straight under it with no route-group-local layout
 * needed. No auth — anyone with a `chatbotId` can load this, same trust
 * boundary as the API route in `./api/chat/route.ts`.
 */
export default async function WidgetPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>;
}) {
  const { chatbotId } = await params;
  if (!isUuid(chatbotId)) {
    notFound();
  }

  const db = getDb();
  const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, chatbotId)).limit(1);
  if (!chatbot) {
    notFound();
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, chatbot.workspaceId))
    .limit(1);
  if (!workspace) {
    notFound();
  }

  // Embedding on other websites is a Pro-only feature (Free is in-app chat
  // only) — a Free-plan chatbot's widget simply isn't reachable.
  if (!PLAN_LIMITS[workspace.plan].widgetEmbedAllowed) {
    notFound();
  }

  // No wrapper div here on purpose: WidgetChat owns its own root element and
  // decides its own height (h-screen standalone vs. auto-sized when
  // embedded in the widget-loader.js <iframe>, see widget-chat.tsx) — an
  // `overflow-hidden` wrapper here previously clipped that auto-sizing to
  // whatever height the iframe already had, so it could never grow.
  return <WidgetChat chatbotId={chatbot.id} chatbotName={chatbot.name} />;
}
