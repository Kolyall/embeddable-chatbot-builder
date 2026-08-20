import type { ReactNode } from "react";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { ChatbotSidebarNav } from "./chatbot-sidebar-nav";

export default async function ChatbotLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspaceId: string; chatbotId: string }>;
}) {
  const { workspaceId, chatbotId } = await params;
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-4 py-10">
      <ChatbotSidebarNav workspaceId={workspace.id} chatbotId={chatbot.id} chatbotName={chatbot.name} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
