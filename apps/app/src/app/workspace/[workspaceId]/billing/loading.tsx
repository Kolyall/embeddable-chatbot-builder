import { LoadingSpinner } from "@cbb/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <LoadingSpinner label="Loading billing…" />
    </div>
  );
}
