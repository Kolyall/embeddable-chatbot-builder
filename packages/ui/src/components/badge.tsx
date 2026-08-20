import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        brand: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        neutral: "bg-muted text-muted-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning-foreground",
        destructive: "bg-destructive/10 text-destructive",
        dark: "bg-foreground text-background",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type BadgeTone = VariantProps<typeof badgeVariants>["tone"];

type Props = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, className, ...props }: Props) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
