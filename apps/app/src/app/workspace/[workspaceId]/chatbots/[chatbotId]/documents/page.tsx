import { getDb, documents as documentsTable, PLAN_LIMITS } from "@cbb/db";
import { desc, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { UploadForm } from "./upload-form";
import { SnippetForm } from "./snippet-form";
import { DocumentsList, type DocumentRow } from "./documents-list";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ workspaceId: string; chatbotId: string }>;
}) {
  const { workspaceId, chatbotId } = await params;
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  const db = getDb();
  const rows = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.chatbotId, chatbot.id))
    .orderBy(desc(documentsTable.createdAt));

  const initialDocuments: DocumentRow[] = rows.map((doc) => ({
    id: doc.id,
    kind: doc.kind,
    filename: doc.filename,
    status: doc.status,
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt.toISOString(),
  }));

  const limit = PLAN_LIMITS[workspace.plan].maxDocumentsPerChatbot;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} / {limit === Infinity ? "∞" : limit} documents
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <UploadForm workspaceId={workspace.id} chatbotId={chatbot.id} />
        <SnippetForm workspaceId={workspace.id} chatbotId={chatbot.id} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">Existing documents</h2>
      <DocumentsList
        workspaceId={workspace.id}
        chatbotId={chatbot.id}
        initialDocuments={initialDocuments}
      />
    </div>
  );
}
