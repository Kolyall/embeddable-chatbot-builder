import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, workspaces, profiles, chatbots, documents } from "@cbb/db";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { ArrowLeft, Info, ShieldCheck, ShieldOff } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cbb/ui";
import { requireAdminOrRedirect } from "@/lib/require-admin-or-redirect";
import { PlanBadge } from "@/components/plan-badge";
import { setWorkspacePlanToFree, setWorkspacePlanToPro, setUserAdmin } from "./actions";
import { DeleteUserButton } from "./delete-user-button";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { profile: currentAdmin } = await requireAdminOrRedirect();

  const db = getDb();

  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      plan: workspaces.plan,
      createdAt: workspaces.createdAt,
      ownerId: workspaces.ownerId,
      ownerEmail: profiles.email,
      ownerIsAdmin: profiles.isAdmin,
    })
    .from(workspaces)
    .innerJoin(profiles, eq(workspaces.ownerId, profiles.id))
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    notFound();
  }

  const isSelf = workspace.ownerId === currentAdmin.id;

  const workspaceChatbots = await db
    .select({ id: chatbots.id, name: chatbots.name, createdAt: chatbots.createdAt })
    .from(chatbots)
    .where(eq(chatbots.workspaceId, workspace.id))
    .orderBy(desc(chatbots.createdAt));

  const chatbotIds = workspaceChatbots.map((c) => c.id);

  const [readyCountRows, [{ count: totalDocuments }], [{ count: totalReadyDocuments }]] =
    await Promise.all([
      chatbotIds.length > 0
        ? db
            .select({ chatbotId: documents.chatbotId, count: count() })
            .from(documents)
            .where(and(inArray(documents.chatbotId, chatbotIds), eq(documents.status, "ready")))
            .groupBy(documents.chatbotId)
        : Promise.resolve([]),
      chatbotIds.length > 0
        ? db
            .select({ count: count() })
            .from(documents)
            .innerJoin(chatbots, eq(documents.chatbotId, chatbots.id))
            .where(eq(chatbots.workspaceId, workspace.id))
        : Promise.resolve([{ count: 0 }]),
      chatbotIds.length > 0
        ? db
            .select({ count: count() })
            .from(documents)
            .innerJoin(chatbots, eq(documents.chatbotId, chatbots.id))
            .where(and(eq(chatbots.workspaceId, workspace.id), eq(documents.status, "ready")))
        : Promise.resolve([{ count: 0 }]),
    ]);

  const readyCountByChatbot = new Map(readyCountRows.map((r) => [r.chatbotId, r.count]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/workspaces"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All workspaces
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-foreground">{workspace.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Owned by {workspace.ownerEmail} · Created {workspace.createdAt.toLocaleDateString()}
          </p>
        </div>
        <PlanBadge plan={workspace.plan} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Billing override</CardTitle>
          <CardDescription className="flex items-start gap-1.5">
            <Info className="mt-0.5 size-4 shrink-0" />
            Billing is fully mocked — there is no Stripe integration. This button is the only way to
            change a workspace&apos;s plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workspace.plan === "free" ? (
            <form action={setWorkspacePlanToPro.bind(null, workspace.id)}>
              <Button type="submit">Set plan to Pro</Button>
            </form>
          ) : (
            <form action={setWorkspacePlanToFree.bind(null, workspace.id)}>
              <Button type="submit" variant="secondary">
                Set plan to Free
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Staff access</CardTitle>
          <CardDescription>
            Admins can sign in to this console. Set by hand — there&apos;s no self-serve "become admin"
            flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSelf ? (
            <p className="text-sm text-muted-foreground">You can&apos;t change your own admin access here.</p>
          ) : workspace.ownerIsAdmin ? (
            <form action={setUserAdmin.bind(null, workspace.ownerId, false)}>
              <Button type="submit" variant="outline">
                <ShieldOff /> Remove admin access
              </Button>
            </form>
          ) : (
            <form action={setUserAdmin.bind(null, workspace.ownerId, true)}>
              <Button type="submit" variant="outline">
                <ShieldCheck /> Grant admin access
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total documents</p>
            <p className="font-display text-xl font-semibold tabular-nums text-foreground">{totalDocuments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ready documents</p>
            <p className="font-display text-xl font-semibold tabular-nums text-foreground">{totalReadyDocuments}</p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Chatbots ({workspaceChatbots.length})
        </h2>
        {workspaceChatbots.length === 0 ? (
          <p className="text-sm text-muted-foreground">This workspace has no chatbots yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Ready documents</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaceChatbots.map((chatbot) => (
                <TableRow key={chatbot.id}>
                  <TableCell className="font-medium text-foreground">{chatbot.name}</TableCell>
                  <TableCell className="tabular-nums">{readyCountByChatbot.get(chatbot.id) ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {chatbot.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Card className="mt-8 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deletes the owner&apos;s Supabase Auth account along with this workspace, every chatbot in
            it, and all uploaded documents. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSelf ? (
            <p className="text-sm text-muted-foreground">You can&apos;t delete your own account here.</p>
          ) : (
            <DeleteUserButton workspaceId={workspace.id} ownerEmail={workspace.ownerEmail} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
