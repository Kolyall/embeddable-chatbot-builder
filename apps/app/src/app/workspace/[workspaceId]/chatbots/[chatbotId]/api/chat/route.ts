import { NextResponse, type NextRequest } from "next/server";
import { streamText, type Message } from "ai";
import { requireUser, UnauthorizedError } from "@cbb/auth";
import { getOwnedChatbot } from "@/lib/workspace-access";
import { getChatModel, ChatProviderConfigError } from "@/lib/ai/chat";
import { retrieveContext } from "@/lib/ai/retrieval";
import { MissingApiKeyError, EmbeddingsNotConfiguredError } from "@/lib/ai/embeddings";

/**
 * In-app owner-facing chat endpoint — NOT the public embeddable widget
 * endpoint (that's a separate, unauthenticated route in a later phase).
 * Uses the signed-in owner's session, so it must live under an
 * ownership-checked path rather than a bare `/api/chat/[chatbotId]`.
 */

export const runtime = "nodejs";

function buildSystemPrompt(chunks: string[], sources: string[]): string {
  if (chunks.length === 0) {
    return [
      "You are a support assistant for this chatbot, but no documents have been indexed for it yet.",
      "Tell the user, politely and briefly, that no documents have been uploaded/indexed yet and you",
      "can't answer questions until some are. Do not attempt to answer from general knowledge.",
    ].join(" ");
  }

  const context = chunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join("\n\n---\n\n");
  const sourceNote = sources.length > 0 ? `\n\nSource documents: ${sources.join(", ")}.` : "";

  return [
    "You are a support assistant that answers questions ONLY using the context below, which was",
    "retrieved from the documents uploaded for this chatbot. If the context does not contain the",
    "answer, say plainly that you don't know / that the uploaded documents don't cover this — never",
    "make up an answer from outside the provided context.",
    "\n\nContext:\n" + context + sourceNote,
  ].join(" ");
}

/** Turns a caught misconfiguration error into a user-facing message, never a raw 500. */
function describeConfigError(err: unknown): string | null {
  if (
    err instanceof ChatProviderConfigError ||
    err instanceof MissingApiKeyError ||
    err instanceof EmbeddingsNotConfiguredError
  ) {
    return err.message;
  }
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chatbotId: string }> },
) {
  const { workspaceId, chatbotId } = await params;

  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    throw err;
  }

  // Ownership check (Decision: every owner-session route under
  // /workspace/[workspaceId] must go through workspace-access.ts). Mismatch
  // => notFound(), which Next.js serves as a plain 404 from a Route Handler.
  const { chatbot } = await getOwnedChatbot(workspaceId, chatbotId, userId);

  let messages: Message[];
  try {
    const body = (await req.json()) as { messages?: Message[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.content ?? "";

  let contextChunks: string[];
  let sources: string[];
  try {
    ({ chunks: contextChunks, sources } = await retrieveContext(chatbot.id, chatbot, query));
  } catch (err) {
    const message = describeConfigError(err);
    if (message) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    throw err;
  }

  let model;
  try {
    model = getChatModel(chatbot);
  } catch (err) {
    const message = describeConfigError(err);
    if (message) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    throw err;
  }

  const system = buildSystemPrompt(contextChunks, sources);

  const result = streamText({
    model,
    system,
    messages,
    // The installed `ai` v4 defaults to temperature:0 when unset (a known
    // legacy quirk, flagged for removal in v5) — some newer models reject an
    // explicit 0 outright ("temperature is deprecated for this model").
    // Pass a real value so the SDK doesn't silently substitute 0.
    temperature: 1,
    onError({ error }) {
      console.error(`[chat] streamText error for chatbot ${chatbot.id}:`, error);
    },
  });

  return result.toDataStreamResponse({
    // A provider-side error mid-stream (e.g. a BYOK key the provider itself
    // rejects) would otherwise surface to useChat as an opaque "An error
    // occurred." — surface the real message instead so the user can act on it.
    getErrorMessage: (error) => (error instanceof Error ? error.message : "Something went wrong."),
  });
}
