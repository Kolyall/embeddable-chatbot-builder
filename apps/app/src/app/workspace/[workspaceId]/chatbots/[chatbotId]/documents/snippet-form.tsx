"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Textarea } from "@cbb/ui";
import { NotebookPen } from "lucide-react";
import { createSnippet } from "./actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = {};

type Props = {
  workspaceId: string;
  chatbotId: string;
};

export function SnippetForm({ workspaceId, chatbotId }: Props) {
  const action = createSnippet.bind(null, workspaceId, chatbotId);
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
        <NotebookPen className="size-4 text-primary" /> Paste text
      </h2>
      <Textarea
        name="content"
        required
        rows={6}
        placeholder="Paste or type the text you want the chatbot to know about…"
        className="text-sm"
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? "Saving…" : "Save snippet"}
      </Button>
    </form>
  );
}
