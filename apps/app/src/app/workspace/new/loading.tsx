import { LoadingSpinner } from "@cbb/ui";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <LoadingSpinner />
    </div>
  );
}
