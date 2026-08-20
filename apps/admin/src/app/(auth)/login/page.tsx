"use client";

import { createSupabaseBrowserClient } from "@cbb/auth/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ParrotMark, TextField } from "@cbb/ui";

/**
 * apps/admin's own login page — a separate Next.js app from apps/app, so it
 * needs its own login form. Admin accounts are provisioned by hand (there is
 * no self-serve signup here) — a successful login just means "known Supabase
 * user"; requireAdmin() at /workspaces is what actually gates access.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/workspaces");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <ParrotMark size={32} />
        Parrot Admin
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold text-foreground">Admin log in</h1>
          <p className="text-sm text-muted-foreground">Instance operator access only.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-1">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
