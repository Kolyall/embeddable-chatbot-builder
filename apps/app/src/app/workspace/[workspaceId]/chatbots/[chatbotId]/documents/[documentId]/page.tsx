import Link from "next/link";
import { getDb, documentChunks } from "@cbb/db";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Badge, type BadgeTone } from "@cbb/ui";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedDocument } from "@/lib/workspace-access";

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "neutral",
  processing: "warning",
  ready: "success",
  failed: "destructive",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; chatbotId: string; documentId: string }>;
}) {
  const { workspaceId, chatbotId, documentId } = await params;
  const user = await requireUserOrRedirect();
  const { workspace, chatbot, document } = await getOwnedDocument(workspaceId, chatbotId, documentId, user.id);

  const chunks =
    document.status === "ready" || document.status === "processing"
      ? await getDb()
          .select({ chunkIndex: documentChunks.chunkIndex, content: documentChunks.content })
          .from(documentChunks)
          .where(eq(documentChunks.documentId, document.id))
          .orderBy(asc(documentChunks.chunkIndex))
      : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/workspace/${workspace.id}/chatbots/${chatbot.id}/documents`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to documents
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 truncate font-display text-2xl font-semibold text-foreground">
          {document.kind === "file" ? document.filename : "Pasted text snippet"}
        </h1>
        <Badge tone={STATUS_TONE[document.status]}>{document.status}</Badge>
      </div>

      <p className="mb-6 text-xs text-muted-foreground">
        Added {new Date(document.createdAt).toLocaleString()}
        {document.kind === "file" ? " · uploaded file" : " · pasted text"}
      </p>

      {document.status === "failed" && document.errorMessage && (
        <p className="mb-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {document.errorMessage}
        </p>
      )}
      {document.status === "pending" && (
        <p className="mb-6 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Still waiting to be processed.
        </p>
      )}

      {document.kind === "snippet" ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">What you pasted</h2>
          <div className="whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground">
            {document.content}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Extracted content{chunks.length > 0 ? ` (${chunks.length} chunk${chunks.length === 1 ? "" : "s"})` : ""}
          </h2>
          {chunks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {document.status === "ready"
                ? "No text could be extracted from this file."
                : "Nothing to show yet — this file hasn't finished processing."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {chunks.map((c) => (
                <div key={c.chunkIndex} className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Chunk {c.chunkIndex + 1}</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
