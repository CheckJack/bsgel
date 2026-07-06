"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export const headerNavActionClass =
  "header-nav-action group relative flex size-9 flex-shrink-0 touch-manipulation items-center justify-center rounded-full border border-black/10 bg-brand-white text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne/35 focus-visible:ring-offset-2";

export const headerNavIconClass = "size-[17px] stroke-[1.35]";

export const headerNavBadgeClass =
  "absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-brand-champagne text-[10px] font-medium leading-none text-brand-white ring-2 ring-brand-white";

type HeaderNavIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  badge?: React.ReactNode;
};

export function HeaderNavIconButton({
  className,
  children,
  badge,
  ...props
}: HeaderNavIconButtonProps) {
  return (
    <button type="button" className={cn(headerNavActionClass, className)} {...props}>
      {children}
      {badge}
    </button>
  );
}

type HeaderNavIconLinkProps = React.ComponentProps<typeof Link> & {
  badge?: React.ReactNode;
};

export function HeaderNavIconLink({
  className,
  children,
  badge,
  ...props
}: HeaderNavIconLinkProps) {
  return (
    <Link className={cn(headerNavActionClass, className)} {...props}>
      {children}
      {badge}
    </Link>
  );
}

type HeaderLanguageToggleProps = {
  language: "en" | "pt";
  onToggle: () => void;
  ariaLabel: string;
  title?: string;
};

export function HeaderLanguageToggle({
  language,
  onToggle,
  ariaLabel,
  title,
  className,
}: HeaderLanguageToggleProps & { className?: string }) {
  const label = language === "en" ? "EN" : "PT";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        headerNavActionClass,
        "font-header w-9 text-[10px] font-medium uppercase tracking-[0.16em]",
        className
      )}
    >
      {label}
    </button>
  );
}
