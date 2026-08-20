"use client";

import { useState, useTransition } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@cbb/ui";
import { Trash2 } from "lucide-react";
import { deleteChatbot } from "./actions";

export function DeleteChatbotDialog({
  workspaceId,
  chatbotId,
  chatbotName,
}: {
  workspaceId: string;
  chatbotId: string;
  chatbotName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteChatbot(workspaceId, chatbotId);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 /> Delete chatbot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {chatbotName}?</DialogTitle>
          <DialogDescription>
            This permanently deletes this chatbot, every document you&apos;ve uploaded to it, and its
            provider settings. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete chatbot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
