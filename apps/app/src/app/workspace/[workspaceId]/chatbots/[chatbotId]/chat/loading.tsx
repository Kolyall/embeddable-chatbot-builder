import { LoadingSpinner } from "@cbb/ui";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <LoadingSpinner label="Loading chat…" />
    </div>
  );
}
