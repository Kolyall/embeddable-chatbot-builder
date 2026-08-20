import { Code2, Globe2, MessageCircle, Upload } from "lucide-react";
import { EXAMPLE_EMBED_DOMAIN, PRODUCT_NAME } from "@/lib/site";

const steps = [
  {
    icon: Upload,
    title: "Upload your documents",
    description:
      "Drop in PDFs, Word docs, plain text, or Markdown — or just paste a snippet of text directly. No formatting cleanup required.",
  },
  {
    icon: MessageCircle,
    title: "Your chatbot is ready",
    description: `${PRODUCT_NAME} reads and indexes what you gave it, and creates a chatbot that answers strictly from that content — no outside guessing.`,
  },
  {
    icon: Code2,
    title: "Use it in-app or embed it",
    description:
      "Chat with it directly in your dashboard, or copy a couple of lines of JavaScript onto your own website to add the widget there.",
  },
  {
    icon: Globe2,
    title: "Your visitors get answers",
    description:
      "Anyone chatting on your site gets accurate, sourced answers pulled from your own documents — around the clock.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From documents to deployed chatbot in four steps.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No prompt engineering, no data pipeline to babysit. Give it your
            content, and it&apos;s ready to talk.
          </p>
        </div>

        <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="size-5" />
                </span>
                <span className="font-mono text-sm text-muted-foreground/60">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Step 3 in full — the whole embed is one script tag:
          </p>
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-foreground shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-background/10 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-destructive/50" />
              <span className="size-2.5 rounded-full bg-warning/50" />
              <span className="size-2.5 rounded-full bg-success/50" />
              <span className="ml-2 text-xs text-background/50">index.html</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-background/90">
              <code>{`<script
  src="https://${EXAMPLE_EMBED_DOMAIN}/widget.js"
  data-chatbot="acme-support"
></script>`}</code>
            </pre>
          </div>
          <p className="max-w-md text-center text-xs text-muted-foreground">
            Paste it before <code className="rounded bg-muted px-1 py-0.5">&lt;/body&gt;</code> on any
            site — no SDK, no backend integration, no build step.
          </p>
        </div>
      </div>
    </section>
  );
}
