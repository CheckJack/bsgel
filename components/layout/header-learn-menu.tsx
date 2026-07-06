"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getNavLearnLinks } from "@/lib/nav-category-links";
import { cn } from "@/lib/utils";

const learnLinkClassName =
  "font-header block px-4 py-2.5 text-sm text-brand-black transition-colors hover:bg-black/5 hover:text-brand-champagne-dark";

type HeaderLearnMenuProps = {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function HeaderLearnMenu({ className, onOpenChange }: HeaderLearnMenuProps) {
  const { t } = useLanguage();
  const links = getNavLearnLinks(t);
  const [menuOpen, setMenuOpen] = useState(false);

  const setOpen = (open: boolean) => {
    setMenuOpen(open);
    onOpenChange?.(open);
  };

  const closeMenu = () => setOpen(false);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="font-header inline-flex items-center gap-1 text-sm uppercase tracking-[0.12em] text-brand-black transition-colors hover:text-brand-champagne-dark"
        aria-haspopup="true"
        aria-expanded={menuOpen}
      >
        <span>{t("header.learn")}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", menuOpen && "rotate-180")}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "absolute left-1/2 top-full z-[50] w-52 -translate-x-1/2 pt-3 transition-opacity duration-200",
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <div className="border border-black/10 bg-brand-white py-2 shadow-xl">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={learnLinkClassName}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={learnLinkClassName}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
