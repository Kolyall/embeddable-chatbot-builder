"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Button, ParrotMark } from "@cbb/ui";
import { ArrowUp, TriangleAlert } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { ChatMarkdown } from "@/components/chat-markdown";

type Props = {
  workspaceId: string;
  chatbotId: string;
  hasReadyDocuments: boolean;
};

export function ChatWidget({ workspaceId, chatbotId, hasReadyDocuments }: Props) {
  // useChat's fetch() is NOT basePath-aware (unlike next/link/router.push),
  // so the basePath has to be prefixed here manually — see lib/base-path.ts.
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: `${BASE_PATH}/workspace/${workspaceId}/chatbots/${chatbotId}/api/chat`,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  if (!hasReadyDocuments) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
        <ParrotMark size={32} className="opacity-70 grayscale" />
        <p className="font-display font-semibold text-foreground">Upload some documents first</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This chatbot has no indexed documents yet, so it has nothing to answer questions from.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-1">
          <Link href={`/workspace/${workspaceId}/chatbots/${chatbotId}/documents`}>Go to Documents</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Ask a question about the documents you&apos;ve uploaded.</p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                message.role === "user"
                  ? "rounded-tr-sm bg-muted text-foreground"
                  : "rounded-tl-sm bg-primary text-primary-foreground"
              }`}
            >
              <ChatMarkdown content={message.content} variant={message.role === "user" ? "user" : "assistant"} />
            </div>
          </div>
        ))}

        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-primary px-3.5 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {error.message || "Something went wrong. Check this chatbot's Settings."}
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question…"
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={isLoading || input.trim().length === 0}
          aria-label="Send message"
        >
          <ArrowUp />
        </Button>
      </form>
    </div>
  );
}
