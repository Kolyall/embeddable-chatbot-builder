import { and, eq, sql } from "drizzle-orm";
import { getDb, documents as documentsTable } from "@cbb/db";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { ChatWidget } from "./chat-widget";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string; chatbotId: string }>;
}) {
  const { workspaceId, chatbotId } = await params;
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documentsTable)
    .where(and(eq(documentsTable.chatbotId, chatbot.id), eq(documentsTable.status, "ready")));

  const hasReadyDocuments = count > 0;

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <h1 className="mb-4 font-display text-2xl font-semibold text-foreground">Chat</h1>
      <ChatWidget
        workspaceId={workspace.id}
        chatbotId={chatbot.id}
        hasReadyDocuments={hasReadyDocuments}
      />
    </div>
  );
}
