"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@cbb/ui";
import { UploadCloud } from "lucide-react";
import { uploadDocument } from "./actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = {};

type Props = {
  workspaceId: string;
  chatbotId: string;
};

export function UploadForm({ workspaceId, chatbotId }: Props) {
  const action = uploadDocument.bind(null, workspaceId, chatbotId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <UploadCloud className="size-4 text-primary" /> Upload a file
      </h2>
      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, or MD.</p>
      <input
        type="file"
        name="file"
        accept=".pdf,.docx,.txt,.md"
        required
        className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-border"
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
