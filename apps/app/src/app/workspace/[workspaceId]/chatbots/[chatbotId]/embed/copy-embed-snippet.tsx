"use client";

import { useState } from "react";
import { Button } from "@cbb/ui";
import { Check, Copy } from "lucide-react";

export function CopyEmbedSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 pr-16 font-mono text-xs text-foreground">
        {snippet}
      </pre>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="absolute right-3 top-3"
      >
        {copied ? (
          <>
            <Check className="text-success" /> Copied
          </>
        ) : (
          <>
            <Copy /> Copy
          </>
        )}
      </Button>
    </div>
  );
}
