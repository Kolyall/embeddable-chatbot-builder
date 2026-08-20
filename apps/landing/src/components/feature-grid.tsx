import { KeyRound, Layers, MessageSquare, Upload, Zap, Code2 } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/site";

const features = [
  {
    icon: Upload,
    title: "Multi-format document upload",
    description:
      "Add PDF, DOCX, TXT, and Markdown files, or paste text snippets straight in when you just need to add a quick paragraph.",
  },
  {
    icon: MessageSquare,
    title: "ChatGPT-like dashboard chat",
    description: `Talk to any of your chatbots directly inside ${PRODUCT_NAME}, in a familiar chat interface — no separate tool to learn.`,
  },
  {
    icon: Code2,
    title: "One-line embeddable widget",
    description:
      "On Pro, paste a couple of lines of JavaScript into your site's HTML and the chat widget appears — no backend integration needed.",
  },
  {
    icon: Zap,
    title: "Streaming responses",
    description:
      "Answers stream in token by token, in the dashboard and in the embedded widget, so visitors see a reply forming immediately.",
  },
  {
    icon: Layers,
    title: "Multiple chatbots, one workspace",
    description:
      "Run a separate chatbot per product, site, or use case — up to 5 on Pro — all managed from a single workspace.",
  },
  {
    icon: KeyRound,
    title: "Bring your own AI provider",
    description:
      "Connect your own OpenAI-compatible endpoint (like OpenRouter) or Anthropic API key for both chat and document embeddings. Your model, your cost, your choice.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="border-t border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to ship a document-grounded chatbot.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nothing you don&apos;t. {PRODUCT_NAME} stays focused on turning
            your content into a chatbot you can actually use.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:shadow-sm"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
