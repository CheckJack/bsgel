"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutToLogin } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useClientNavSections, type ClientNavItem } from "@/components/client/use-client-nav-sections";
import { headerNavActionClass } from "@/components/layout/header-nav-actions";

const linkClassName =
  "font-header flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-black transition-colors hover:bg-black/5 hover:text-brand-champagne-dark";

type ClientAccountMenuProps = {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function ClientAccountMenu({ className, onOpenChange }: ClientAccountMenuProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { sections } = useClientNavSections();
  const [menuOpen, setMenuOpen] = useState(false);

  const setOpen = (open: boolean) => {
    setMenuOpen(open);
    onOpenChange?.(open);
  };
  const closeMenu = () => setOpen(false);

  const isItemActive = (item: ClientNavItem) => {
    if (!item.href) return false;
    return (
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`))
    );
  };

  const renderNavItem = (item: ClientNavItem, nested = false) => {
    const Icon = item.icon;

    if (item.children?.length) {
      return (
        <div key={item.title} className="py-1">
          <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-black/45">
            {item.title}
          </div>
          {item.children.map((child) => renderNavItem(child, true))}
        </div>
      );
    }

    if (!item.href) return null;

    return (
      <Link
        key={item.href}
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        className={cn(
          linkClassName,
          nested && "pl-6",
          isItemActive(item) && "bg-black/5 text-brand-champagne-dark"
        )}
        onClick={closeMenu}
      >
        <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
        <span>{item.title}</span>
      </Link>
    );
  };

  const avatarContent = session?.user?.image ? (
    <img
      src={session.user.image}
      alt="Profile"
      className="h-full w-full object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = session?.user?.email?.charAt(0).toUpperCase() || "U";
        }
      }}
    />
  ) : (
    session?.user?.email?.charAt(0).toUpperCase() || "U"
  );

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
        className={cn(
          headerNavActionClass,
          "overflow-hidden p-0 text-sm font-semibold text-brand-champagne-dark"
        )}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-label={t("clientPanel.sidebar.myAccount")}
        onClick={() => setOpen(!menuOpen)}
      >
        {avatarContent}
      </button>

      <div
        className={cn(
          "absolute right-0 top-full z-[1200] w-64 pt-3 transition-opacity duration-200",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="overflow-hidden border border-black/10 bg-brand-white shadow-xl">
          <div className="border-b border-black/10 px-4 py-3">
            <div className="text-sm font-semibold text-brand-black">
              {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-xs text-brand-black/55">{session?.user?.email}</div>
          </div>

          <div className="max-h-[min(70vh,28rem)] overflow-y-auto py-2">
            {sections.map((section) => (
              <div key={section.title} className="py-1">
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-black/45">
                  {section.title}
                </div>
                {section.items.map((item) => renderNavItem(item))}
              </div>
            ))}
          </div>

          <div className="border-t border-black/10 py-2">
            <button
              type="button"
              className={cn(linkClassName, "w-full text-left")}
              onClick={() => {
                closeMenu();
                if (window.confirm(t("clientPanel.sidebar.signOutConfirm"))) {
                  void signOutToLogin();
                }
              }}
            >
              <LogOut className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>{t("clientPanel.sidebar.signOut")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
