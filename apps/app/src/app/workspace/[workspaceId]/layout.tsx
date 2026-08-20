import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, Badge, LogoutButton, ParrotMark } from "@cbb/ui";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedWorkspace } from "@/lib/workspace-access";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUserOrRedirect();
  const workspace = await getOwnedWorkspace(workspaceId, user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-y-3 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={`/workspace/${workspace.id}`} className="flex items-center gap-2">
              <ParrotMark size={26} />
              <span className="font-display font-semibold text-foreground">{workspace.name}</span>
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link
                href={`/workspace/${workspace.id}`}
                className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Chatbots
              </Link>
              <Link
                href={`/workspace/${workspace.id}/billing`}
                className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Billing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={workspace.plan === "pro" ? "brand" : "neutral"}>
              {workspace.plan === "pro" ? "Pro" : "Free"}
            </Badge>
            <Avatar>
              <AvatarFallback>{(user.email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
