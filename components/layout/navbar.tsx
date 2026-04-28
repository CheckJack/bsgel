"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X, Search, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useState, useRef, useEffect } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ShopMegaMenu } from "./shop-mega-menu";
import { SearchDrawer } from "./search-drawer";
import { NotificationDropdown } from "./notification-dropdown";
import { useLanguage } from "@/contexts/language-context";

export function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMegaMenuOpen, setShopMegaMenuOpen] = useState(false);
  const [expandedShopItems, setExpandedShopItems] = useState<Set<string>>(new Set());
  const [expandedAboutItems, setExpandedAboutItems] = useState<Set<string>>(new Set());
  const [navbarHeight, setNavbarHeight] = useState(0);
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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is on the toggle button or inside the mobile menu
      const isMobileMenuButton = target.closest('[data-mobile-menu-button]');
      const isInsideMobileMenu = target.closest('[data-mobile-menu-content]');
      
      if (mobileMenuOpen && !isMobileMenuButton && !isInsideMobileMenu) {
        setMobileMenuOpen(false);
      }
    };

    const preventScroll = (e: TouchEvent | WheelEvent) => {
      e.preventDefault();
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent scrolling without affecting navbar visibility
      // Use html overflow to prevent scroll while keeping navbar sticky
      document.documentElement.style.overflow = "hidden";
      // Also prevent touch and wheel scrolling
      document.addEventListener("touchmove", preventScroll, { passive: false });
      document.addEventListener("wheel", preventScroll, { passive: false });
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.documentElement.style.overflow = "";
        document.removeEventListener("touchmove", preventScroll);
        document.removeEventListener("wheel", preventScroll);
      };
    } else {
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [mobileMenuOpen]);

  // Calculate navbar height for mobile menu positioning (includes banner)
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (headerWrapperRef.current) {
        setNavbarHeight(headerWrapperRef.current.offsetHeight);
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    
    // Update height when mobile menu opens to ensure accurate positioning
    if (mobileMenuOpen) {
      // Small delay to ensure DOM is updated
      setTimeout(updateNavbarHeight, 0);
    }
    
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, [mobileMenuOpen]);

  // Listen for custom event to open cart drawer
  useEffect(() => {
    const handleOpenCartDrawer = () => {
      setCartDrawerOpen(true);
    };

    window.addEventListener("openCartDrawer", handleOpenCartDrawer as EventListener);
    return () => {
      window.removeEventListener("openCartDrawer", handleOpenCartDrawer as EventListener);
    };
  }, []);

  return (
    <div ref={headerWrapperRef} className="sticky top-0 z-[100]">
      {/* Free Shipping Notice Banner */}
      <div className="bg-brand-champagne-dark border-b border-brand-black py-2.5 overflow-hidden relative">
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes marqueeScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `
        }} />
        <div 
          className="flex items-center whitespace-nowrap"
          style={{
            animation: 'marqueeScroll 30s linear infinite',
            willChange: 'transform'
          }}
        >
          {/* First set */}
          {[...Array(10)].map((_, i) => (
            <div key={`first-${i}`} className="flex items-center flex-shrink-0">
              <span className="text-xs font-normal text-brand-white tracking-wide font-futura px-8">
                {t("header.freeShippingBanner")}
              </span>
              <span className="text-xs mx-4">📦</span>
            </div>
          ))}
          {/* Second set - exact duplicate for seamless loop */}
          {[...Array(10)].map((_, i) => (
            <div key={`second-${i}`} className="flex items-center flex-shrink-0">
              <span className="text-xs font-normal text-brand-white tracking-wide font-futura px-8">
                {t("header.freeShippingBanner")}
              </span>
              <span className="text-xs mx-4">📦</span>
            </div>
          ))}
        </div>
      </div>
      
      <nav 
        ref={navbarRef}
        className="bg-brand-black relative"
        onMouseLeave={() => {
          setShopMegaMenuOpen(false);
        }}
      >
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 py-4 md:py-6 relative overflow-visible">
        <div className="flex items-center justify-between relative overflow-visible">
          {/* Left - Logo and Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                // Reset expanded states when closing menu
                if (mobileMenuOpen) {
                  setExpandedShopItems(new Set());
                  setExpandedAboutItems(new Set());
                }
              }}
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0 md:hidden"
              aria-label="Toggle menu"
              data-mobile-menu-button
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center z-50 relative">
              <Image
                src="/logo.png"
                alt="Bio Sculpture"
                width={162}
                height={17}
                className="h-4 md:h-5 w-auto object-contain"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Right - Navigation and Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 overflow-visible">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3 lg:gap-6">
            <div 
              ref={shopMegaMenuRef}
              className="relative"
              onMouseEnter={() => {
                setShopMegaMenuOpen(true);
              }}
              onMouseOver={() => {
                // Prefetch API data on hover for faster loading
                fetch("/api/mega-menu-cards?menuType=SHOP", { 
                  method: 'GET',
                  cache: 'force-cache'
                }).catch(() => {});
              }}
            >
                <Link 
                  href="/products" 
                  className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap"
                >
                  {t("nav.shop")}
                </Link>
              </div>
              
            <div 
              className="relative"
            >
              <Link href="/about" className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap">
                {t("nav.about")}
              </Link>
            </div>

            <Link 
              href="/training" 
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap"
            >
              {t("nav.training")}
            </Link>
            <Link
              href="/nail-diagnostics"
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap"
            >
              {t("nav.shopMenu.nailDiagnosis")}
            </Link>
            <Link
              href="/find-your-salon"
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap"
            >
              {t("nav.aboutMenu.findSalon")}
            </Link>
            <Link
              href="/blog"
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap"
            >
              {t("nav.aboutMenu.blog")}
            </Link>
            <Link
              href="/contact"
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap"
            >
              {t("nav.aboutMenu.contact")}
            </Link>
            </div>

            {/* Desktop divider */}
            <div className="hidden md:block w-px h-6 bg-gray-700"></div>

            {/* Search Icon */}
            <button
              onClick={() => setSearchDrawerOpen(true)}
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Search products"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Notifications - Only show for logged-in users */}
            {session && <NotificationDropdown />}

            {session ? (
              <>
                <Link 
                  href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"} 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0"
                  title={session.user.role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(t("nav.signOut"))) {
                      signOut({ callbackUrl: "/login" });
                    }
                  }}
                  className="hidden md:inline-flex text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 text-sm lg:text-base whitespace-nowrap px-3 h-auto py-1"
                >
                  {t("nav.signOut")}
                </Button>
              </>
            ) : (
              <Link href="/login" className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0" title={t("nav.signIn")}>
                <User className="h-6 w-6" />
              </Link>
            )}

            {/* Language Selector */}
            <button
              onClick={() => setLanguage(language === "en" ? "pt" : "en")}
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0 text-sm lg:text-base px-2"
              aria-label={language === "en" ? t("header.switchToPortuguese") : t("header.switchToEnglish")}
              title={t("header.currentLanguage", { language: language === "en" ? t("header.english") : t("header.portuguese") })}
            >
              <span className="text-lg">{language === "en" ? "🇬🇧" : "🇵🇹"}</span>
            </button>

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-sweet-bianca text-brand-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="fixed left-0 right-0 bg-brand-black border-t border-gray-800 md:hidden z-[60] overflow-y-auto"
            style={{ top: `${navbarHeight}px`, maxHeight: `calc(100vh - ${navbarHeight}px)` }}
            data-mobile-menu-content
          >
            <div className="w-full px-6 md:px-12 lg:px-16 py-4 space-y-1">
              {/* Shop Menu with Subpages */}
              <div>
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedShopItems);
                    if (newExpanded.has('shop')) {
                      newExpanded.delete('shop');
                    } else {
                      newExpanded.add('shop');
                      // Close About menu if it's open
                      setExpandedAboutItems(new Set());
                    }
                    setExpandedShopItems(newExpanded);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                >
                  <span>{t("nav.shop")}</span>
                  {expandedShopItems.has('shop') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {expandedShopItems.has('shop') && (
                  <div className="pl-4 mt-1 space-y-1">
                    <Link
                      href="/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.allProducts")}
                    </Link>
                    <Link
                      href="/bio-gel"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.bioGel")}
                    </Link>
                    <Link
                      href="/bio-gel/treatment-gels"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.treatmentGels")}
                    </Link>
                    <Link
                      href="/gemini"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.gemini")}
                    </Link>
                    <Link
                      href="/colours"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.colours")}
                    </Link>
                    <Link
                      href="/colours/reds-browns"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.redsBrowns")}
                    </Link>
                    <Link
                      href="/colours/pinks-purples"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.pinksPurples")}
                    </Link>
                    <Link
                      href="/colours/whites-nudes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.whitesNudes")}
                    </Link>
                    <Link
                      href="/colours/oranges-yellows"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.orangesYellows")}
                    </Link>
                    <Link
                      href="/colours/brights"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.brights")}
                    </Link>
                    <Link
                      href="/colours/blues-greens"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.bluesGreens")}
                    </Link>
                    <Link
                      href="/colours/fluorescents"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.fluorescents")}
                    </Link>
                    <Link
                      href="/ethos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.ethos")}
                    </Link>
                    <Link
                      href="/ethos/nail-diagnosis"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.nailDiagnosis")}
                    </Link>
                    <Link
                      href="/spa"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.spa")}
                    </Link>
                    <Link
                      href="/spa/hand-care"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.handCare")}
                    </Link>
                    <Link
                      href="/spa/foot-care"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.footCare")}
                    </Link>
                    <Link
                      href="/evo"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.evo")}
                    </Link>
                    <Link
                      href="/evo/treatment-base-gels"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.treatmentBaseGels")}
                    </Link>
                    <Link
                      href="/evo/top-coats"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.shopMenu.topCoats")}
                    </Link>
                    <Link
                      href="/bases"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.bases")}
                    </Link>
                    <Link
                      href="/builders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.builders")}
                    </Link>
                    <Link
                      href="/softs"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.softs")}
                    </Link>
                    <Link
                      href="/extensao"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.extensao")}
                    </Link>
                    <Link
                      href="/bundles"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.bundles")}
                    </Link>
                    <Link
                      href="/eletronicos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.eletronicos")}
                    </Link>
                    <Link
                      href="/promocoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.promocoes")}
                    </Link>
                    <Link
                      href="/kits-treino"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.kitsTreino")}
                    </Link>
                    <Link
                      href="/solventes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.solventes")}
                    </Link>
                    <Link
                      href="/nail-art"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.nailArt")}
                    </Link>
                    <Link
                      href="/tips"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.tips")}
                    </Link>
                    <Link
                      href="/utensilios"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.utensilios")}
                    </Link>
                    <Link
                      href="/pinceis"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.pinceis")}
                    </Link>
                    <Link
                      href="/lima-buffs"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.shopMenu.limaBuffs")}
                    </Link>
                  </div>
                )}
              </div>
              
              {/* About Menu with Subpages */}
              <div>
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedAboutItems);
                    if (newExpanded.has('about')) {
                      newExpanded.delete('about');
                    } else {
                      newExpanded.add('about');
                      // Close Shop menu if it's open
                      setExpandedShopItems(new Set());
                    }
                    setExpandedAboutItems(newExpanded);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                >
                  <span>{t("nav.about")}</span>
                  {expandedAboutItems.has('about') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {expandedAboutItems.has('about') && (
                  <div className="pl-4 mt-1 space-y-1">
                    <Link
                      href="/about/biosculpture"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.aboutMenu.biosculpture")}
                    </Link>
                    <Link
                      href="/about/biosculpture/sustainability"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.aboutMenu.sustainability")}
                    </Link>
                    <Link
                      href="/about/biosculpture/awards"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.aboutMenu.awards")}
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.aboutMenu.contact")}
                    </Link>
                    <Link
                      href="/salons"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-gray-400 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded pl-8"
                    >
                      {t("nav.aboutMenu.findSalon")}
                    </Link>
                    <Link
                      href="/blog"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
                    >
                      {t("nav.aboutMenu.blog")}
                    </Link>
                  </div>
                )}
              </div>

              {/* Training Link */}
              <Link
                href="/training"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
              >
                {t("nav.training")}
              </Link>
              
              {session && (
                <div className="border-t border-gray-800 pt-3 mt-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(t("nav.signOut"))) {
                        signOut({ callbackUrl: "/login" });
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="w-full text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 text-left justify-start px-4 py-3 h-auto"
                  >
                    {t("nav.signOut")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ShopMegaMenu 
        isOpen={shopMegaMenuOpen} 
        onClose={() => setShopMegaMenuOpen(false)}
        onMouseEnter={() => setShopMegaMenuOpen(true)}
      />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      <SearchDrawer isOpen={searchDrawerOpen} onClose={() => setSearchDrawerOpen(false)} />
    </nav>
    </div>
  );
}

