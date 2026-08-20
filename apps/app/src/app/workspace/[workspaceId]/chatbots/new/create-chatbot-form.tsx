"use client";

import { useActionState } from "react";
import { Button, TextField } from "@cbb/ui";
import { createChatbot } from "./actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = {};

export function CreateChatbotForm({ workspaceId }: { workspaceId: string }) {
  const action = createChatbot.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField label="Chatbot name" name="name" required placeholder="Support bot" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create chatbot"}
      </Button>
    </form>
  );
}
