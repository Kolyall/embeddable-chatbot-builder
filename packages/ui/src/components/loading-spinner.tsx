import { cn } from "../lib/cn";

type Props = {
  label?: string;
  className?: string;
};

/**
 * Shared instant-loading indicator for `loading.tsx` route segments (and
 * anywhere else a Suspense fallback is needed) in both apps/app and
 * apps/admin. Purely presentational, no app-specific copy — callers pass
 * `label` for context ("Loading chatbots…") when it's worth being specific.
 */
export function LoadingSpinner({ label = "Loading…", className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-7 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary"
      />
      <span>{label}</span>
    </div>
  );
}
