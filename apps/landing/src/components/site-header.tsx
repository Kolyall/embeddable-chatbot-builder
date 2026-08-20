"use client";

import { ParrotMark } from "@cbb/ui";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LOGIN_URL, NAV_LINKS, PRODUCT_NAME, SIGNUP_URL } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground">
          <ParrotMark size={30} />
          {PRODUCT_NAME}
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={LOGIN_URL}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </a>
          <a
            href={SIGNUP_URL}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Get started free
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-border/70 px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
            <a href={LOGIN_URL} className="text-sm font-medium text-foreground">
              Log in
            </a>
            <a
              href={SIGNUP_URL}
              className="rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Get started free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
