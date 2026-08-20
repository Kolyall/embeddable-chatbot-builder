// Single source of truth for product naming and cross-app links, so copy
// stays consistent across the header, hero, pricing, and footer.

export const PRODUCT_NAME = "Parrot";

export const TAGLINE = "A chatbot that only repeats what you taught it.";

// Relative by default (`/app/login`) — correct in production, where nginx
// path-routes "/app/*" on the same domain (see nginx/nginx.conf), and in the
// full containerized dry-run. Host-run `pnpm dev` has no nginx in front, so
// landing (port 3000) and app (port 3001) are genuinely different origins —
// set NEXT_PUBLIC_APP_URL (e.g. http://localhost:3001) in apps/landing/.env.local
// to point these links at the app's own dev server instead.
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const LOGIN_URL = `${APP_BASE_URL}/app/login`;
export const SIGNUP_URL = `${APP_BASE_URL}/app/signup`;

// Used only in the illustrative embed-snippet mockup on the hero — not a
// real deployed domain.
export const EXAMPLE_EMBED_DOMAIN = "cdn.parrot.chat";

export const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
] as const;
