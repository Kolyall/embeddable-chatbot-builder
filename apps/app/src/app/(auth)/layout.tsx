import { ParrotMark } from "@cbb/ui";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <a href="/workspace" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <ParrotMark size={32} />
        Parrot
      </a>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}
