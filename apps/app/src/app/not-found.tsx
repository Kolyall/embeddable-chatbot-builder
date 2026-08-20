import Link from "next/link";
import { Button, ParrotMark } from "@cbb/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <ParrotMark size={40} />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold text-foreground">Nothing to see here</h1>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>
      <Button asChild>
        <Link href="/workspace">Back to your workspace</Link>
      </Button>
    </div>
  );
}
