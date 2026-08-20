import { Check } from "lucide-react";
import { PRODUCT_NAME, SIGNUP_URL } from "@/lib/site";

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: `Everything you need to try ${PRODUCT_NAME} on a real project.`,
    cta: "Get started free",
    highlighted: false,
    features: [
      "1 chatbot",
      "Bring your own AI provider & API key — OpenAI-compatible endpoints or Anthropic Claude",
      "Up to 10 documents per chatbot",
      "In-app chat only (no embeddable widget)",
    ],
  },
  {
    name: "Pro",
    price: "Upgrade",
    cadence: "from inside your dashboard",
    description: "For teams running more than one chatbot, embedded on real websites.",
    cta: "Upgrade to Pro",
    highlighted: true,
    features: [
      "Up to 5 chatbots",
      "Bring your own AI provider & API key — OpenAI-compatible endpoints or Anthropic Claude",
      "Unlimited documents per chatbot",
      "Embed the chat widget on any website",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple pricing, no seats to count.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every workspace has a single owner. Start free, and upgrade
            whenever you need more chatbots or want to embed your chatbot on
            another website.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 ${
                plan.highlighted
                  ? "border-transparent bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  Most flexible
                </span>
              )}

              <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
              <p className={`mt-2 text-sm ${plan.highlighted ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {plan.cadence}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                    <Check
                      className={`mt-0.5 size-5 shrink-0 ${plan.highlighted ? "text-primary-foreground" : "text-primary"}`}
                    />
                    <span className={plan.highlighted ? "text-primary-foreground/90" : "text-foreground/80"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={SIGNUP_URL}
                className={`mt-10 flex h-12 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-card text-primary hover:bg-card/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          No third tier, no per-seat pricing — {PRODUCT_NAME} workspaces have
          a single owner by design.
        </p>
      </div>
    </section>
  );
}
