import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Props = {
  content: string;
  /** Adjusts inline-code/link contrast for the primary-colored "assistant"
   * bubble vs the light "user" bubble — both chat surfaces (in-app + widget)
   * reuse this same set of message bubble colors. */
  variant: "user" | "assistant";
};

/**
 * Renders LLM/user chat message content as Markdown (bold, italics, lists,
 * links, inline code, code blocks, tables via GFM) instead of raw text with
 * literal `**`/backticks — used by both the in-app chat and the embeddable
 * widget's chat, so a styling change here covers both surfaces.
 */
export function ChatMarkdown({ content, variant }: Props) {
  const isAssistant = variant === "assistant";

  const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="mb-0.5">{children}</li>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={`underline underline-offset-2 ${isAssistant ? "text-primary-foreground" : "text-primary"}`}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={`mb-2 border-l-2 pl-3 italic last:mb-0 ${isAssistant ? "border-primary-foreground/40" : "border-border"}`}
      >
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = /language-/.test(className ?? "");
      if (isBlock) {
        return (
          <code className={`font-mono text-xs ${className ?? ""}`} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${
            isAssistant ? "bg-primary-foreground/20" : "bg-background text-foreground"
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre
        className={`mb-2 overflow-x-auto rounded p-3 last:mb-0 ${
          isAssistant ? "bg-black/20" : "bg-foreground text-background"
        }`}
      >
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto last:mb-0">
        <table className="border-collapse text-left text-xs">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className={`border px-2 py-1 font-medium ${isAssistant ? "border-primary-foreground/30" : "border-border"}`}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className={`border px-2 py-1 ${isAssistant ? "border-primary-foreground/30" : "border-border"}`}>
        {children}
      </td>
    ),
  };

  return (
    <div className="text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
