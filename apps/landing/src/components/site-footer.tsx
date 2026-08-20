import { ParrotMark } from "@cbb/ui";
import { LOGIN_URL, NAV_LINKS, PRODUCT_NAME, SIGNUP_URL } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <a href="#top" className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground">
            <ParrotMark size={26} />
            {PRODUCT_NAME}
          </a>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Turn your documents into a chatbot you can use in your dashboard
            or embed on your own website.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="font-medium text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
          <a href={LOGIN_URL} className="font-medium text-muted-foreground hover:text-foreground">
            Log in
          </a>
          <a href={SIGNUP_URL} className="font-medium text-muted-foreground hover:text-foreground">
            Get started free
          </a>
        </nav>
      </div>

      <div className="mx-auto mt-10 max-w-6xl px-6">
        <p className="text-xs text-muted-foreground/70">
          &copy; {year} {PRODUCT_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
