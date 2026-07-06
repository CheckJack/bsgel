"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { signOutToLogin } from "@/lib/auth-client";
import { ShoppingBag, UserRound, Menu, X, Search, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ShopMegaMenu } from "./shop-mega-menu";
import { SearchDrawer } from "./search-drawer";
import { NotificationDropdown } from "./notification-dropdown";
import {
  HeaderLanguageToggle,
  HeaderNavIconButton,
  HeaderNavIconLink,
  headerNavBadgeClass,
  headerNavIconClass,
} from "./header-nav-actions";
import { useLanguage } from "@/contexts/language-context";
import { PromoBanner } from "@/components/layout/promo-banner";
import { HeaderLearnMenu } from "@/components/layout/header-learn-menu";
import { ClientAccountMenu } from "@/components/client/client-account-menu";
import { getNavCategoryLinks, getNavLearnLinks, getNavShopMenuLinks } from "@/lib/nav-category-links";
import { setAppScrollLocked } from "@/lib/mobile-scroll-root";
import { cn } from "@/lib/utils";

const MOBILE_MENU_SOCIAL_LINKS = [
  { href: "https://facebook.com/biosculpture", label: "Facebook", Icon: Facebook },
  { href: "https://instagram.com/biosculpture", label: "Instagram", Icon: Instagram },
  { href: "https://twitter.com/biosculpture", label: "Twitter", Icon: Twitter },
  { href: "https://youtube.com/biosculpture", label: "YouTube", Icon: Youtube },
] as const;

type NavbarProps = {
  /** Salons map: header hidden until the user hovers the top edge */
  revealOnHover?: boolean;
};

export function Navbar({ revealOnHover = false }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { itemCount, refreshCart } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const learnLinks = getNavLearnLinks(t);
  const shopMenuLinks = getNavShopMenuLinks(t);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [shouldRenderMobileMenu, setShouldRenderMobileMenu] = useState(false);
  const [shopMegaMenuOpen, setShopMegaMenuOpen] = useState(false);
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [headerRevealed, setHeaderRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shopMegaMenuRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const headerWrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside shop mega menu
      // Don't close if clicking on a link inside the mega menu (let navigation happen)
      if (shopMegaMenuOpen) {
        const isMegaMenuLink = target.closest('[data-mega-menu-link]');
        const isInsideMegaMenu = target.closest('[data-mega-menu]');
        const isInsideShopRef = shopMegaMenuRef.current?.contains(target);
        
        // Only close if click is truly outside and not on a mega menu link
        if (!isInsideShopRef && !isInsideMegaMenu && !isMegaMenuLink) {
          setShopMegaMenuOpen(false);
        }
      }

    };

    if (shopMegaMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [shopMegaMenuOpen]);

  // Close mega menu when the pointer moves outside the menu and its trigger
  useEffect(() => {
    if (!shopMegaMenuOpen) return;

    const handleHoverOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-mega-menu]") || target.closest("[data-shop-mega-menu-trigger]")) {
        return;
      }
      setShopMegaMenuOpen(false);
    };

    document.addEventListener("mouseover", handleHoverOutside, true);
    return () => document.removeEventListener("mouseover", handleHoverOutside, true);
  }, [shopMegaMenuOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mobile menu enter/exit animation (same pattern as cart drawer)
  useEffect(() => {
    if (mobileMenuOpen) {
      setShouldRenderMobileMenu(true);
      const fadeInTimer = window.setTimeout(() => setMobileMenuVisible(true), 10);
      return () => window.clearTimeout(fadeInTimer);
    }

    setMobileMenuVisible(false);
    const fadeOutTimer = window.setTimeout(() => setShouldRenderMobileMenu(false), 300);
    return () => window.clearTimeout(fadeOutTimer);
  }, [mobileMenuOpen]);

  // Lock page scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      setAppScrollLocked(true);
    } else {
      setAppScrollLocked(false);
    }
    return () => setAppScrollLocked(false);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  const headerPinnedOpen =
    mobileMenuOpen ||
    shopMegaMenuOpen ||
    learnMenuOpen ||
    cartDrawerOpen ||
    searchDrawerOpen ||
    accountMenuOpen ||
    notificationsOpen;
  const isHeaderVisible = !revealOnHover || headerRevealed || headerPinnedOpen;
  const headerElevated =
    shopMegaMenuOpen ||
    learnMenuOpen ||
    accountMenuOpen ||
    notificationsOpen ||
    mobileMenuOpen ||
    cartDrawerOpen;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const closeCartDrawer = () => setCartDrawerOpen(false);

  const openSearchDrawer = () => {
    setMobileMenuOpen(false);
    setCartDrawerOpen(false);
    setSearchDrawerOpen(true);
  };

  const openCartDrawer = () => {
    setMobileMenuOpen(false);
    setSearchDrawerOpen(false);
    setCartDrawerOpen(true);
  };

  const toggleCartDrawer = () => {
    setMobileMenuOpen(false);
    setSearchDrawerOpen(false);
    setCartDrawerOpen((open) => !open);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((open) => {
      const next = !open;
      if (next) {
        setCartDrawerOpen(false);
        setSearchDrawerOpen(false);
      }
      return next;
    });
  };

  // Keep --site-header-height synced when promo banner opens/closes.
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (headerWrapperRef.current) {
        const height = headerWrapperRef.current.offsetHeight;
        if (revealOnHover && !isHeaderVisible) {
          document.documentElement.style.setProperty("--site-header-height", "0px");
        } else {
          document.documentElement.style.setProperty("--site-header-height", `${height}px`);
        }
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    window.addEventListener("load", updateNavbarHeight);

    const headerEl = headerWrapperRef.current;
    const observer = headerEl ? new ResizeObserver(() => updateNavbarHeight()) : null;
    if (headerEl && observer) {
      observer.observe(headerEl);
    }

    if (mobileMenuOpen) {
      setTimeout(updateNavbarHeight, 0);
    }

    return () => {
      window.removeEventListener("resize", updateNavbarHeight);
      window.removeEventListener("load", updateNavbarHeight);
      observer?.disconnect();
    };
  }, [mobileMenuOpen, cartDrawerOpen, revealOnHover, isHeaderVisible]);

  useEffect(() => {
    if (!revealOnHover) {
      setHeaderRevealed(false);
    }
  }, [revealOnHover]);

  // Listen for custom event to open cart drawer
  useEffect(() => {
    const handleOpenCartDrawer = () => {
      void refreshCart();
      setMobileMenuOpen(false);
      setCartDrawerOpen(true);
    };

    window.addEventListener("openCartDrawer", handleOpenCartDrawer as EventListener);
    return () => {
      window.removeEventListener("openCartDrawer", handleOpenCartDrawer as EventListener);
    };
  }, [refreshCart]);

  return (
    <>
    {revealOnHover && (
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[1010] h-4 pointer-events-auto",
          !isHeaderVisible && "bg-gradient-to-b from-black/10 to-transparent"
        )}
        onMouseEnter={() => setHeaderRevealed(true)}
        onFocus={() => setHeaderRevealed(true)}
        onTouchStart={() => setHeaderRevealed(true)}
        aria-hidden
      />
    )}
    <div
      ref={headerWrapperRef}
      data-site-header
      className={cn(
        "fixed inset-x-0 top-0 transition-transform duration-300 ease-out will-change-transform",
        headerElevated ? (mobileMenuOpen || cartDrawerOpen ? "z-[1400]" : "z-[1200]") : "z-[100]",
        revealOnHover && !headerElevated && "z-[1000]",
        revealOnHover && !isHeaderVisible && "-translate-y-full pointer-events-none"
      )}
      onMouseEnter={() => revealOnHover && setHeaderRevealed(true)}
      onMouseLeave={() => {
        if (revealOnHover && !headerPinnedOpen) {
          setHeaderRevealed(false);
        }
      }}
      onFocusCapture={() => revealOnHover && setHeaderRevealed(true)}
    >
      <PromoBanner />

      <nav 
        ref={navbarRef}
        className="relative border-b border-black/10 bg-brand-white"
      >
      <div className="font-header w-full relative overflow-visible">
        {/* Main navigation row */}
        <div className="relative px-4 sm:px-6 md:px-12 lg:px-16 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <HeaderNavIconButton
                onClick={toggleMobileMenu}
                className="lg:hidden"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                data-mobile-menu-button
              >
                {mobileMenuOpen ? (
                  <X className={headerNavIconClass} aria-hidden />
                ) : (
                  <Menu className={headerNavIconClass} aria-hidden />
                )}
              </HeaderNavIconButton>

              <div className="flex items-center gap-2 md:hidden">
                <HeaderNavIconButton
                  onClick={openSearchDrawer}
                  aria-label="Search products"
                >
                  <Search className={headerNavIconClass} aria-hidden />
                </HeaderNavIconButton>
              </div>

              <Link
                href="/colours#products"
                className="hidden sm:inline-flex items-center rounded-full border border-brand-black px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-brand-black hover:text-brand-white"
              >
                {t("header.buildersCta")}
              </Link>
            </div>

            <Link
              href="/"
              className="absolute left-1/2 z-50 flex -translate-x-1/2 items-center"
            >
              <Image
                src="/bio-sculpture-black.png"
                alt="Bio Sculpture"
                width={7442}
                height={756}
                sizes="(max-width: 640px) 145px, (max-width: 1024px) 165px, 190px"
                className="h-auto w-[145px] object-contain sm:w-[165px] lg:w-[190px]"
                priority
              />
            </Link>

            <div className="flex flex-1 items-center justify-end gap-2 overflow-visible sm:gap-3">
              <HeaderLearnMenu className="hidden lg:flex" onOpenChange={setLearnMenuOpen} />

            {/* Search — desktop only (mobile is next to menu) */}
            <HeaderNavIconButton
              className="hidden md:flex"
              onClick={openSearchDrawer}
              aria-label="Search products"
            >
              <Search className={headerNavIconClass} aria-hidden />
            </HeaderNavIconButton>

            {/* Notifications - Only show for logged-in users */}
            {session && (
              <NotificationDropdown onOpenChange={setNotificationsOpen} />
            )}

            {session ? (
              <>
                {session.user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    onClick={() => {
                      closeMobileMenu();
                      closeCartDrawer();
                    }}
                    className="flex size-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-champagne/45 bg-brand-sweet-bianca/40 text-sm font-semibold text-brand-champagne-dark transition-all hover:border-brand-champagne hover:bg-brand-sweet-bianca/70"
                    title="Admin Panel"
                  >
                    {session?.user?.image ? (
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
                    )}
                  </Link>
                ) : (
                  <ClientAccountMenu
                    onOpenChange={(open) => {
                      setAccountMenuOpen(open);
                      if (open) {
                        setMobileMenuOpen(false);
                        setCartDrawerOpen(false);
                      }
                    }}
                  />
                )}
              </>
            ) : (
              <HeaderNavIconLink
                href="/login"
                title={t("nav.signIn")}
                aria-label={t("nav.signIn")}
                onClick={() => {
                  closeMobileMenu();
                  closeCartDrawer();
                }}
              >
                <UserRound className={headerNavIconClass} aria-hidden />
              </HeaderNavIconLink>
            )}

            <HeaderLanguageToggle
              className="hidden md:flex"
              language={language}
              onToggle={() => setLanguage(language === "en" ? "pt" : "en")}
              ariaLabel={language === "en" ? t("header.switchToPortuguese") : t("header.switchToEnglish")}
              title={t("header.currentLanguage", {
                language: language === "en" ? t("header.english") : t("header.portuguese"),
              })}
            />

            <HeaderNavIconButton onClick={toggleCartDrawer} aria-label="Open cart">
              <ShoppingBag className={headerNavIconClass} aria-hidden />
              {itemCount > 0 && (
                <span className={headerNavBadgeClass}>
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </HeaderNavIconButton>
            </div>
          </div>
        </div>

        {/* Category navigation row — desktop only; mobile uses full-screen menu */}
        <div className="hidden border-t border-black/10 lg:block">
          <div className="scrollbar-hide flex items-center justify-start gap-x-4 overflow-x-auto px-4 py-2.5 sm:justify-center sm:gap-x-5 md:flex-wrap md:overflow-visible lg:gap-x-6 lg:px-16">
            {getNavCategoryLinks(t).map((link) => (
              <div
                key={link.href}
                ref={link.megaMenu ? shopMegaMenuRef : undefined}
                data-shop-mega-menu-trigger={link.megaMenu ? true : undefined}
                className="relative"
                onMouseEnter={() => {
                  if (link.megaMenu) {
                    setShopMegaMenuOpen(true);
                  }
                }}
                onMouseLeave={(event) => {
                  if (!link.megaMenu) return;
                  const related = event.relatedTarget as Element | null;
                  if (related?.closest("[data-mega-menu]")) return;
                  setShopMegaMenuOpen(false);
                }}
                onMouseOver={() => {
                  if (link.megaMenu) {
                    fetch("/api/mega-menu-cards?menuType=SHOP", {
                      method: "GET",
                      cache: "force-cache",
                    }).catch(() => {});
                  }
                }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-brand-black transition-colors hover:text-brand-champagne-dark",
                    link.highlight && "text-brand-champagne-dark"
                  )}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
      <ShopMegaMenu 
        isOpen={shopMegaMenuOpen} 
        onClose={() => setShopMegaMenuOpen(false)}
        onMouseEnter={() => setShopMegaMenuOpen(true)}
      />
    </nav>
    </div>
    <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    <SearchDrawer isOpen={searchDrawerOpen} onClose={() => setSearchDrawerOpen(false)} />

    {mounted &&
      shouldRenderMobileMenu &&
      createPortal(
        <div
          className="pointer-events-none fixed inset-0 z-[1300] lg:hidden"
          aria-hidden={!mobileMenuVisible}
        >
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 bg-black/40 transition-opacity duration-300",
              mobileMenuVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
            style={{ top: "var(--site-header-height, 113px)" }}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex max-w-full transform transition-transform duration-300 ease-out",
              mobileMenuVisible ? "pointer-events-auto" : "pointer-events-none",
              mobileMenuOpen && mobileMenuVisible ? "translate-x-0" : "-translate-x-full"
            )}
            style={{
              top: "var(--site-header-height, 113px)",
              height: "calc(100dvh - var(--site-header-height, 113px))",
            }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.shop")}
            data-mobile-menu-content
          >
            <div className="flex h-full w-full flex-col bg-brand-white shadow-[2px_0_16px_rgba(0,0,0,0.06)]">
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
            <Link
              href="/colours#products"
              onClick={closeMobileMenu}
              className="font-header mb-4 flex min-h-11 w-full items-center justify-center rounded-full bg-brand-black px-4 text-sm uppercase tracking-[0.12em] text-brand-white transition-colors hover:bg-brand-champagne-dark"
            >
              {t("header.buildersCta")}
            </Link>

            <p className="font-header mb-2 px-2 text-[11px] uppercase tracking-[0.16em] text-brand-champagne-dark">
              {t("nav.shop")}
            </p>
            <ul className="mb-6 divide-y divide-black/10 border-y border-black/10">
              {shopMenuLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="font-header block py-3.5 text-[15px] text-brand-black transition-colors hover:text-brand-champagne-dark"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="font-header mb-2 px-2 text-[11px] uppercase tracking-[0.16em] text-brand-champagne-dark">
              {t("header.learn")}
            </p>
            <ul className="divide-y divide-black/10 border-y border-black/10">
              {learnLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="font-header block py-3.5 text-[15px] text-brand-black transition-colors hover:text-brand-champagne-dark"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="font-header block py-3.5 text-[15px] text-brand-black transition-colors hover:text-brand-champagne-dark"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-black/10 bg-brand-white px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {session ? (
                  <Link
                    href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    onClick={closeMobileMenu}
                    className="font-header inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 px-3 text-sm text-brand-black transition-colors hover:border-brand-champagne/45 hover:text-brand-champagne-dark"
                  >
                    <UserRound className="size-4" aria-hidden />
                    {t("footer.myAccount")}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="font-header inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 px-3 text-sm text-brand-black transition-colors hover:border-brand-champagne/45 hover:text-brand-champagne-dark"
                  >
                    <UserRound className="size-4" aria-hidden />
                    {t("nav.signIn")}
                  </Link>
                )}

                <HeaderLanguageToggle
                  language={language}
                  onToggle={() => setLanguage(language === "en" ? "pt" : "en")}
                  ariaLabel={
                    language === "en" ? t("header.switchToPortuguese") : t("header.switchToEnglish")
                  }
                  title={t("header.currentLanguage", {
                    language: language === "en" ? t("header.english") : t("header.portuguese"),
                  })}
                />
              </div>

              <div className="flex items-center gap-2">
                {MOBILE_MENU_SOCIAL_LINKS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-brand-black transition-colors hover:border-black/20 hover:bg-black/[0.06]"
                    aria-label={label}
                  >
                    <Icon className="size-4" aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            {session && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t("nav.signOut"))) {
                    void signOutToLogin();
                    closeMobileMenu();
                  }
                }}
                className="font-header mt-3 w-full text-left text-xs text-brand-black/55 underline-offset-2 transition-colors hover:text-brand-champagne-dark hover:underline"
              >
                {t("nav.signOut")}
              </button>
            )}
          </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    <div
      data-site-header-spacer
      className={cn(
        "shrink-0",
        revealOnHover ? "h-0" : "h-[var(--site-header-height,113px)]"
      )}
      aria-hidden
    />
    </>
  );
}

