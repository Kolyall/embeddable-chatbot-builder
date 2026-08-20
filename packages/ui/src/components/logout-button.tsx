"use client";

import { createSupabaseBrowserClient } from "@cbb/auth/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./button";

/**
 * Identical in apps/app and apps/admin: signs out of Supabase and sends the
 * user back to this app's own /login (basePath-relative, so it resolves
 * correctly in either app).
 */
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      <LogOut />
      {loading ? "Logging out…" : "Log out"}
    </Button>
  );
}
