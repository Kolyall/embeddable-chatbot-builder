"use client";

import { useActionState } from "react";
import { Button, TextField } from "@cbb/ui";
import { createWorkspace } from "./actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = {};

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspace, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <TextField label="Workspace name" name="name" required placeholder="Acme Inc" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}
