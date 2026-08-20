import { NextResponse, type NextRequest } from "next/server";
import { streamText, type Message } from "ai";
import { eq } from "drizzle-orm";
import { getDb, chatbots, workspaces, PLAN_LIMITS } from "@cbb/db";
import { getChatModel, ChatProviderConfigError } from "@/lib/ai/chat";
import { retrieveContext } from "@/lib/ai/retrieval";
import { MissingApiKeyError, EmbeddingsNotConfiguredError } from "@/lib/ai/embeddings";
import { checkAndIncrementWidgetRateLimit } from "@/lib/rate-limit/widget-limiter";
import { isUuid } from "@/lib/is-uuid";

/**
 * PUBLIC, unauthenticated widget chat endpoint — embedded via
 * `public/widget-loader.js` on arbitrary third-party sites. Anyone who knows
 * a `chatbotId` may call this (that's the point), so there is deliberately
 * NO `requireUser()`/ownership check here — trust boundary is rate limiting
 * only (Decision 14), no origin/CORS allowlist. Never persists any
 * conversation history: no DB writes beyond the rate-limit counter, and the
 * response must never leak sensitive chatbot fields (encrypted API keys,
 * base URLs, etc) — only what's needed to answer, nothing about the chatbot
 * itself is even reflected back in the response body.
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  const { chatbotId } = await params;
  if (!isUuid(chatbotId)) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }

  const db = getDb();
  const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, chatbotId)).limit(1);
  if (!chatbot) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, chatbot.workspaceId))
    .limit(1);
  if (!workspace) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }

  // Embedding on other websites is Pro-only (Decision: Free = in-app chat
  // only) — mirrors the widget page's own gate, in case someone calls this
  // API route directly without going through the iframe page.
  if (!PLAN_LIMITS[workspace.plan].widgetEmbedAllowed) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }

  const { allowed } = await checkAndIncrementWidgetRateLimit(chatbotId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded, please try again in a moment." },
      { status: 429 },
    );
  }

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
    // See the owner-facing chat route for why this is explicit — the
    // installed `ai` v4 defaults to temperature:0 when unset, which some
    // newer models reject outright.
    temperature: 1,
    onError({ error }) {
      console.error(`[widget-chat] streamText error for chatbot ${chatbot.id}:`, error);
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => (error instanceof Error ? error.message : "Something went wrong."),
  });
}
