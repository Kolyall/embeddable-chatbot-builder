"use client";

import { useActionState, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextField,
} from "@cbb/ui";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { updateChatbotSettings, fetchChatModels } from "./actions";
import type { ActionState } from "@/lib/action-state";

const initialState: ActionState = {};

type ChatProviderType = "openai_compatible" | "anthropic";
type EmbeddingProvider = "openai" | "gemini" | "voyage" | "cohere";

type Props = {
  workspaceId: string;
  chatbotId: string;
  name: string;
  chatProviderType: ChatProviderType | null;
  chatBaseUrl: string | null;
  chatModel: string | null;
  hasChatApiKey: boolean;
  embeddingProvider: EmbeddingProvider | null;
  hasEmbeddingApiKey: boolean;
  embeddingDimSet: boolean;
  saved: boolean;
};

/**
 * Every chatbot is BYOK-only — there's no "Platform (default)" option here.
 * A brand-new chatbot starts with both providers unset (empty-string
 * sentinel below), and the owner must pick + configure a real one before
 * the bot can actually chat or ingest documents.
 */
export function ChatbotSettingsForm(props: Props) {
  const action = updateChatbotSettings.bind(null, props.workspaceId, props.chatbotId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [chatProviderType, setChatProviderType] = useState<ChatProviderType | "">(
    props.chatProviderType ?? "",
  );
  const [embeddingProvider, setEmbeddingProvider] = useState<EmbeddingProvider | "">(
    props.embeddingProvider ?? "",
  );

  // Controlled so "Fetch models" can read the not-yet-saved base URL/key.
  const [chatBaseUrl, setChatBaseUrl] = useState(props.chatBaseUrl ?? "");
  const [chatApiKeyInput, setChatApiKeyInput] = useState("");
  const [chatModel, setChatModel] = useState(props.chatModel ?? "");
  const [modelOptions, setModelOptions] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const embeddingProviderChanged = embeddingProvider !== (props.embeddingProvider ?? "");

  const canFetchModels =
    chatApiKeyInput.trim().length > 0 &&
    (chatProviderType === "anthropic" || (chatProviderType === "openai_compatible" && chatBaseUrl.trim().length > 0));

  async function handleFetchModels() {
    if (chatProviderType === "") return;
    setModelsLoading(true);
    setModelsError(null);
    const result = await fetchChatModels(
      props.workspaceId,
      props.chatbotId,
      chatProviderType,
      chatProviderType === "openai_compatible" ? chatBaseUrl : undefined,
      chatApiKeyInput,
    );
    setModelsLoading(false);
    if ("error" in result) {
      setModelsError(result.error);
      setModelOptions(null);
      return;
    }
    setModelOptions(result.models);
    if (!result.models.includes(chatModel)) {
      setChatModel(result.models[0] ?? "");
    }
  }

  function resetModelFetchState() {
    setModelOptions(null);
    setModelsError(null);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <TextField label="Name" name="name" required defaultValue={props.name} />

      <Card>
        <CardHeader>
          <CardTitle>Chat provider</CardTitle>
          <CardDescription>Bring your own API key — used for every message this chatbot sends.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Provider</Label>
            <Select
              name="chatProviderType"
              required
              value={chatProviderType || undefined}
              onValueChange={(value) => {
                setChatProviderType(value as ChatProviderType);
                resetModelFetchState();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai_compatible">OpenAI-compatible endpoint</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {chatProviderType === "openai_compatible" && (
            <>
              <TextField
                label="Base URL"
                name="chatBaseUrl"
                required
                value={chatBaseUrl}
                onChange={(e) => {
                  setChatBaseUrl(e.target.value);
                  resetModelFetchState();
                }}
                placeholder="https://api.example.com/v1"
              />
              <TextField
                label="API key"
                name="chatApiKey"
                type="password"
                autoComplete="off"
                value={chatApiKeyInput}
                onChange={(e) => {
                  setChatApiKeyInput(e.target.value);
                  resetModelFetchState();
                }}
                placeholder={props.hasChatApiKey ? "•••••••• (leave blank to keep)" : "Enter API key"}
              />
              <ModelPicker
                chatModel={chatModel}
                setChatModel={setChatModel}
                modelOptions={modelOptions}
                modelsLoading={modelsLoading}
                modelsError={modelsError}
                canFetchModels={canFetchModels}
                onFetchModels={handleFetchModels}
                placeholder="gpt-4o-mini"
              />
            </>
          )}

          {chatProviderType === "anthropic" && (
            <>
              <TextField
                label="API key"
                name="chatApiKey"
                type="password"
                autoComplete="off"
                value={chatApiKeyInput}
                onChange={(e) => {
                  setChatApiKeyInput(e.target.value);
                  resetModelFetchState();
                }}
                placeholder={props.hasChatApiKey ? "•••••••• (leave blank to keep)" : "Enter API key"}
              />
              <ModelPicker
                chatModel={chatModel}
                setChatModel={setChatModel}
                modelOptions={modelOptions}
                modelsLoading={modelsLoading}
                modelsError={modelsError}
                canFetchModels={canFetchModels}
                onFetchModels={handleFetchModels}
                placeholder="claude-sonnet-5"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embeddings provider</CardTitle>
          <CardDescription>
            Bring your own API key — used to index documents and search them for chat answers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {props.embeddingDimSet && embeddingProviderChanged && (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <TriangleAlert className="size-4 shrink-0" />
              Changing this requires re-indexing all documents.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Provider</Label>
            <Select
              name="embeddingProvider"
              required
              value={embeddingProvider || undefined}
              onValueChange={(value) => setEmbeddingProvider(value as EmbeddingProvider)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="voyage">Voyage</SelectItem>
                <SelectItem value="cohere">Cohere</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {embeddingProvider !== "" && (
            <TextField
              label="API key"
              name="embeddingApiKey"
              type="password"
              autoComplete="off"
              placeholder={props.hasEmbeddingApiKey ? "•••••••• (leave blank to keep)" : "Enter API key"}
            />
          )}
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {!state.error && !pending && props.saved && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="size-4" /> Settings saved.
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

function ModelPicker(props: {
  chatModel: string;
  setChatModel: (v: string) => void;
  modelOptions: string[] | null;
  modelsLoading: boolean;
  modelsError: string | null;
  canFetchModels: boolean;
  onFetchModels: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          {props.modelOptions && props.modelOptions.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <Label>Model</Label>
              <Select name="chatModel" value={props.chatModel} onValueChange={props.setChatModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {props.modelOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <TextField
              label="Model"
              name="chatModel"
              required
              value={props.chatModel}
              onChange={(e) => props.setChatModel(e.target.value)}
              placeholder={props.placeholder}
            />
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={!props.canFetchModels || props.modelsLoading}
          onClick={props.onFetchModels}
        >
          {props.modelsLoading ? "Fetching…" : "Fetch models"}
        </Button>
      </div>
      {props.modelsError && <p className="text-sm text-destructive">{props.modelsError}</p>}
      {props.modelOptions && (
        <Badge tone="neutral" className="w-fit">
          {props.modelOptions.length} model{props.modelOptions.length === 1 ? "" : "s"} available
        </Badge>
      )}
    </div>
  );
}
