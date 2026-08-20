import { LoadingSpinner } from "@cbb/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <LoadingSpinner label="Loading chatbot…" />
    </div>
  );
}
