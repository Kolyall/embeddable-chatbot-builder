"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@cbb/auth/client";
import { Badge, type BadgeTone } from "@cbb/ui";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "./actions";

export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export type DocumentRow = {
  id: string;
  kind: "file" | "snippet";
  filename: string | null;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
};

type Props = {
  workspaceId: string;
  chatbotId: string;
  initialDocuments: DocumentRow[];
};

const STATUS_TONE: Record<DocumentStatus, BadgeTone> = {
  pending: "neutral",
  processing: "warning",
  ready: "success",
  failed: "destructive",
};

/** Raw shape of a `documents` row as it arrives over Realtime (snake_case). */
type RawDocumentRow = {
  id: string;
  kind: "file" | "snippet";
  filename: string | null;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
};

function fromRaw(row: RawDocumentRow): DocumentRow {
  return {
    id: row.id,
    kind: row.kind,
    filename: row.filename,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

/**
 * Renders the document list and keeps it live via Supabase Realtime
 * (postgres_changes on `documents`, filtered to this chatbot) so status
 * flips pending -> processing -> ready/failed without a manual refresh.
 * `initialDocuments` (the server-rendered snapshot) seeds state on mount;
 * every subsequent insert/update/delete — whether from this tab's own
 * upload/snippet/delete Server Actions or from ingestion progress in the
 * worker — arrives the same way, over the Realtime subscription below.
 */
export function DocumentsList({ workspaceId, chatbotId, initialDocuments }: Props) {
  const [docs, setDocs] = useState<DocumentRow[]>(initialDocuments);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`documents-${chatbotId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `chatbot_id=eq.${chatbotId}`,
        },
        (payload) => {
          setDocs((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as Partial<RawDocumentRow>).id;
              return prev.filter((d) => d.id !== oldId);
            }

            const next = fromRaw(payload.new as RawDocumentRow);
            const exists = prev.some((d) => d.id === next.id);
            return exists ? prev.map((d) => (d.id === next.id ? next : d)) : [next, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatbotId]);

  const deleteAction = deleteDocument.bind(null, workspaceId, chatbotId);

  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents yet.</p>;
  }

  const sorted = [...docs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
        >
          <div className="min-w-0">
            <Link
              href={`/workspace/${workspaceId}/chatbots/${chatbotId}/documents/${doc.id}`}
              className="truncate font-medium text-foreground hover:text-primary"
            >
              {doc.kind === "file" ? doc.filename : "Pasted text snippet"}
            </Link>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
              {doc.status === "failed" && doc.errorMessage && (
                <span className="truncate text-xs text-destructive" title={doc.errorMessage}>
                  {doc.errorMessage}
                </span>
              )}
            </div>
          </div>
          <form action={deleteAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <button
              type="submit"
              aria-label="Delete document"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
