import { refreshSupabaseSession } from "@cbb/auth";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
