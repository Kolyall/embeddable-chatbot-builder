import { Badge } from "@cbb/ui";

export function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  return <Badge tone={plan === "pro" ? "brand" : "neutral"}>{plan === "pro" ? "Pro" : "Free"}</Badge>;
}
