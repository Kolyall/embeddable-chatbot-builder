import { ParrotMark } from "@cbb/ui";
import { FileText } from "lucide-react";
import { EXAMPLE_EMBED_DOMAIN, PRODUCT_NAME, SIGNUP_URL } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-6xl gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <FileText className="size-3.5 text-primary" />
            Documents in, chatbot out
          </span>

          <h1 className="mt-6 text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
            A chatbot that only knows what <span className="text-primary">you</span> taught it.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Upload your PDFs, Word docs, text files, or paste in a quick
            snippet — {PRODUCT_NAME} turns them into a chat assistant grounded
            entirely in your own content. Use it inside your dashboard like a
            private ChatGPT, or embed it on your website with a couple of
            lines of JavaScript so your visitors can ask it questions too.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href={SIGNUP_URL}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              Get started free
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Free forever for one chatbot. No credit card required.
          </p>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -left-6 -top-10 size-40 -rotate-6 bg-accent/15"
        style={{ borderRadius: "42% 58% 65% 35% / 45% 45% 55% 55%" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-10 -right-4 size-48 rotate-12 bg-primary/15"
        style={{ borderRadius: "58% 42% 35% 65% / 55% 55% 45% 45%" }}
      />

      {/* A little fanned stack of "documents" feeding into the widget below —
          the actual visual claim being made ("docs in, chatbot out"). */}
      <div className="relative mb-6 flex items-end justify-center gap-3">
        {[-8, 0, 8].map((rotate, i) => (
          <div
            key={rotate}
            className="flex h-16 w-12 -rotate-0 items-center justify-center rounded-md border border-border bg-card shadow-sm"
            style={{ transform: `rotate(${rotate}deg) translateY(${i === 1 ? -4 : 0}px)` }}
          >
            <FileText className="size-5 text-muted-foreground" />
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/50" />
          <span className="size-2.5 rounded-full bg-warning/50" />
          <span className="size-2.5 rounded-full bg-success/50" />
          <span className="ml-2 text-xs text-muted-foreground">Support widget — acme.com</span>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-muted px-4 py-2.5 text-sm text-foreground">
              What&apos;s your return policy?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              Items can be returned within 30 days of delivery, unused and in
              their original packaging. Refunds are issued to the original
              payment method within 5 business days.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-muted px-4 py-2.5 text-sm text-foreground">
              Does that apply to sale items too?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-primary px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/80" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ParrotMark size={16} />
            <span className="font-mono text-[11px] text-muted-foreground">
              &lt;script src=&quot;https://{EXAMPLE_EMBED_DOMAIN}/widget.js&quot;
              <br />
              &nbsp;&nbsp;data-chatbot=&quot;acme-support&quot;&gt;&lt;/script&gt;
            </span>
          </div>
          <span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm">
            Powered by {PRODUCT_NAME}
          </span>
        </div>
      </div>
    </div>
  );
}
