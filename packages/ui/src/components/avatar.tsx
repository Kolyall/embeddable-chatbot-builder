import * as RadixAvatar from "@radix-ui/react-avatar";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export function Avatar({ className, ...props }: ComponentProps<typeof RadixAvatar.Root>) {
  return (
    <RadixAvatar.Root
      className={cn("relative flex size-9 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof RadixAvatar.Fallback>) {
  return (
    <RadixAvatar.Fallback
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
}
