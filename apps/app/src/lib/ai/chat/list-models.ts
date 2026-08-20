/**
 * "Fetch models" support for the chat provider settings form: given a
 * not-yet-saved base URL/API key typed into the form, ask the provider
 * itself what models are available, so the user picks from a real list
 * instead of typing a model id by hand.
 */

export class ListModelsError extends Error {}

/** Any OpenAI-compatible endpoint (OpenRouter, GonkaAI, etc.) — the Chat
 * Completions API convention also exposes `GET {baseURL}/models` returning
 * `{ data: [{ id: string }, ...] }`. */
export async function listOpenAICompatibleModels(baseUrl: string, apiKey: string): Promise<string[]> {
  const url = new URL("models", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ListModelsError("Could not reach that base URL. Check it's correct and reachable.");
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new ListModelsError("That API key was rejected by the provider.");
    }
    throw new ListModelsError(`Provider returned an error (${res.status}) listing models.`);
  }

  const body = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (body.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) {
    throw new ListModelsError("That endpoint didn't return any models — check the base URL.");
  }
  return ids.sort();
}

/** Anthropic's native List Models endpoint. */
export async function listAnthropicModels(apiKey: string): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/models?limit=1000", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ListModelsError("Could not reach the Anthropic API.");
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new ListModelsError("That API key was rejected by Anthropic.");
    }
    throw new ListModelsError(`Anthropic returned an error (${res.status}) listing models.`);
  }

  const body = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (body.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) {
    throw new ListModelsError("Anthropic didn't return any models for this key.");
  }
  return ids.sort().reverse(); // newest-looking ids first, good enough without real release dates
}
