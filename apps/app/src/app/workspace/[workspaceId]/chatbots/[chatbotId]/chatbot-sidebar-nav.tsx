"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, FileText, MessageCircle, Settings } from "lucide-react";
import { cn } from "@cbb/ui";

type Props = {
  workspaceId: string;
  chatbotId: string;
  chatbotName: string;
};

export function ChatbotSidebarNav({ workspaceId, chatbotId, chatbotName }: Props) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}/chatbots/${chatbotId}`;

  const items = [
    { href: `${base}/chat`, label: "Chat", icon: MessageCircle },
    { href: `${base}/documents`, label: "Documents", icon: FileText },
    { href: `${base}/embed`, label: "Embed", icon: Code2 },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-48 shrink-0">
      <p className="mb-4 truncate px-2 font-display text-sm font-semibold text-foreground">{chatbotName}</p>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
