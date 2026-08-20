"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { cn, ParrotMark } from "@cbb/ui";
import { ArrowUp, TriangleAlert } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { ChatMarkdown } from "@/components/chat-markdown";

type Props = {
  chatbotId: string;
  chatbotName: string;
};

/** postMessage shape this page sends to `window.parent` so the embed loader
 * (public/widget-loader.js) can resize the host page's <iframe>. */
type ResizeMessage = { type: "cbb-widget-resize"; height: number };

export function WidgetChat({ chatbotId, chatbotName }: Props) {
  // Plain fetch() calls are NOT basePath-aware (unlike next/link), so the
  // request path has to be built by hand from the shared BASE_PATH constant.
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: `${BASE_PATH}/widget/${chatbotId}/api/chat`,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // The "Preview the widget" link (Settings -> Embed) opens this same page
  // directly, full-page, outside any <iframe> — there it should behave like
  // a normal full-height chat app. Embedded in the real widget-loader.js
  // <iframe>, it must instead size itself to its own content (see the
  // resize effect below), so this page can't hard-code h-screen either way.
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  // Tell the parent page (via the loader script) how tall this content is so
  // it can resize the host <iframe> — on mount and whenever the content's
  // height changes (new messages, error banner appearing, etc).
  useEffect(() => {
    const postHeight = () => {
      const height = document.documentElement.scrollHeight;
      const message: ResizeMessage = { type: "cbb-widget-resize", height };
      window.parent.postMessage(message, "*");
    };

    postHeight();

    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(postHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [messages, isLoading, error]);

  return (
    <div
      ref={rootRef}
      className={cn("flex w-full flex-col bg-card text-foreground", isEmbedded ? "h-auto" : "h-screen")}
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ParrotMark size={20} />
        <h1 className="truncate text-sm font-semibold">{chatbotName}</h1>
      </header>

      <div
        className={cn(
          "space-y-3 overflow-y-auto p-3",
          // Embedded: capped so the page's natural height stays measurable
          // (see the resize effect above) — h-screen would lock it to
          // whatever height the host <iframe> currently is, so every
          // measurement would just echo back the size it was already given
          // and the widget could never grow past its initial collapsed
          // height. Standalone ("Preview the widget"): fill the viewport
          // like a normal full-height chat app instead.
          isEmbedded ? "max-h-[420px]" : "flex-1",
        )}
      >
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground">Ask a question — I&apos;ll answer using this site&apos;s documents.</p>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === "user" ? "rounded-tr-sm bg-muted text-foreground" : "rounded-tl-sm bg-primary text-primary-foreground"
              }`}
            >
              <ChatMarkdown content={message.content} variant={message.role === "user" ? "user" : "assistant"} />
            </div>
          </div>
        ))}

        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-primary px-3 py-2.5">
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <TriangleAlert className="size-3.5 shrink-0" />
            {error.message || "Something went wrong. Please try again in a moment."}
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question…"
          className="flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          aria-label="Send message"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>

      <div className="flex items-center justify-center gap-1 border-t border-border py-1.5 text-[10px] text-muted-foreground">
        <ParrotMark size={12} /> Powered by Parrot
      </div>
    </div>
  );
}
