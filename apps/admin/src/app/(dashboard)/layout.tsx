import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, LogoutButton, ParrotMark } from "@cbb/ui";
import { requireAdminOrRedirect } from "@/lib/require-admin-or-redirect";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdminOrRedirect();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/workspaces" className="flex items-center gap-2">
              <ParrotMark size={26} />
              <span className="font-display font-semibold text-foreground">Admin</span>
              <Badge tone="neutral">Operator console</Badge>
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link
                href="/workspaces"
                className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Workspaces
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
