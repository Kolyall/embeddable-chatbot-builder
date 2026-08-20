import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@cbb/ui";
import { requireUserOrRedirect } from "@/lib/require-user-or-redirect";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { maskApiKey } from "@/lib/crypto/aes-gcm";
import { ChatbotSettingsForm } from "./chatbot-settings-form";
import { DeleteChatbotDialog } from "./delete-chatbot-dialog";

export default async function ChatbotSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string; chatbotId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { workspaceId, chatbotId } = await params;
  const { saved } = await searchParams;
  const user = await requireUserOrRedirect();
  const { workspace, chatbot } = await getOwnedChatbot(workspaceId, chatbotId, user.id);

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">Settings</h1>
      <ChatbotSettingsForm
        workspaceId={workspace.id}
        chatbotId={chatbot.id}
        name={chatbot.name}
        chatProviderType={chatbot.chatProviderType}
        chatBaseUrl={chatbot.chatBaseUrl}
        chatModel={chatbot.chatModel}
        hasChatApiKey={maskApiKey(chatbot.chatApiKeyEncrypted) !== null}
        embeddingProvider={chatbot.embeddingProvider}
        hasEmbeddingApiKey={maskApiKey(chatbot.embeddingApiKeyEncrypted) !== null}
        embeddingDimSet={chatbot.embeddingDim !== null}
        saved={saved === "1"}
      />

      <Card className="mt-8 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deletes this chatbot and every document uploaded to it. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteChatbotDialog workspaceId={workspace.id} chatbotId={chatbot.id} chatbotName={chatbot.name} />
        </CardContent>
      </Card>
    </div>
  );
}
