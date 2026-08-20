import Link from "next/link";
import { getDb, workspaces, profiles, chatbots } from "@cbb/db";
import { count, desc, eq } from "drizzle-orm";
import { Card, CardContent, ParrotMark, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@cbb/ui";
import { requireAdminOrRedirect } from "@/lib/require-admin-or-redirect";
import { PlanBadge } from "@/components/plan-badge";

/**
 * Superadmin view — every workspace on the instance, not scoped to any one
 * user. Chatbot counts per workspace are fetched as a single grouped query
 * and merged in-memory rather than joined directly, so workspaces with zero
 * chatbots aren't duplicated/dropped by join arithmetic.
 */
export default async function WorkspacesPage() {
  await requireAdminOrRedirect();

  const db = getDb();

  const [rows, chatbotCountRows, [{ count: totalWorkspaces }], [{ count: proWorkspaces }], [{ count: totalChatbots }]] =
    await Promise.all([
      db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          plan: workspaces.plan,
          createdAt: workspaces.createdAt,
          ownerEmail: profiles.email,
        })
        .from(workspaces)
        .innerJoin(profiles, eq(workspaces.ownerId, profiles.id))
        .orderBy(desc(workspaces.createdAt)),
      db
        .select({ workspaceId: chatbots.workspaceId, count: count() })
        .from(chatbots)
        .groupBy(chatbots.workspaceId),
      db.select({ count: count() }).from(workspaces),
      db.select({ count: count() }).from(workspaces).where(eq(workspaces.plan, "pro")),
      db.select({ count: count() }).from(chatbots),
    ]);

  const chatbotCountByWorkspace = new Map(chatbotCountRows.map((r) => [r.workspaceId, r.count]));
  const freeWorkspaces = totalWorkspaces - proWorkspaces;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">Workspaces</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total workspaces" value={totalWorkspaces} />
        <StatCard label="Pro" value={proWorkspaces} />
        <StatCard label="Free" value={freeWorkspaces} />
        <StatCard label="Total chatbots" value={totalChatbots} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-12 text-center">
          <ParrotMark size={32} />
          <p className="font-display font-semibold text-foreground">No workspaces yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Workspaces will show up here once someone signs up and creates one.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Chatbots</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((workspace) => (
              <TableRow key={workspace.id}>
                <TableCell>
                  <Link href={`/workspaces/${workspace.id}`} className="font-medium text-foreground hover:text-primary">
                    {workspace.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{workspace.ownerEmail}</TableCell>
                <TableCell>
                  <PlanBadge plan={workspace.plan} />
                </TableCell>
                <TableCell className="tabular-nums">{chatbotCountByWorkspace.get(workspace.id) ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">
                  {workspace.createdAt.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
