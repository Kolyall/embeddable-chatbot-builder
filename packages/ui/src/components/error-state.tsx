import { ParrotMark } from "./parrot-mark";
import { Button } from "./button";

type Props = {
  message?: string;
  onRetry: () => void;
};

/**
 * Shared "Something went wrong" fallback rendered by every `error.tsx`
 * route-segment boundary across apps/app and apps/admin. The `error.tsx`
 * file itself has to live per-app/per-segment (Next.js file convention,
 * and it needs the `retry` callback passed down from the framework), but
 * the actual fallback markup is identical everywhere it's used.
 */
export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <ParrotMark size={36} className="opacity-70 grayscale" />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
