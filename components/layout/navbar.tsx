"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X, Search } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useState, useRef, useEffect } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ShopMegaMenu } from "./shop-mega-menu";
import { AboutMegaMenu } from "./about-mega-menu";
import { SearchDrawer } from "./search-drawer";
import { NotificationDropdown } from "./notification-dropdown";

export function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMegaMenuOpen, setShopMegaMenuOpen] = useState(false);
  const [aboutMegaMenuOpen, setAboutMegaMenuOpen] = useState(false);
  const shopMegaMenuRef = useRef<HTMLDivElement>(null);
  const aboutMegaMenuRef = useRef<HTMLDivElement>(null);

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

      // Check if click is outside about mega menu
      if (aboutMegaMenuOpen) {
        const isMegaMenuLink = target.closest('[data-mega-menu-link]');
        const isInsideMegaMenu = target.closest('[data-mega-menu]');
        const isInsideAboutRef = aboutMegaMenuRef.current?.contains(target);
        
        // Only close if click is truly outside and not on a mega menu link
        if (!isInsideAboutRef && !isInsideMegaMenu && !isMegaMenuLink) {
          setAboutMegaMenuOpen(false);
        }
      }
    };

    if (shopMegaMenuOpen || aboutMegaMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [shopMegaMenuOpen, aboutMegaMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('[data-mobile-menu]')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
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
    <nav 
      className="sticky top-0 bg-brand-black z-50 relative"
      onMouseLeave={() => {
        setShopMegaMenuOpen(false);
        setAboutMegaMenuOpen(false);
      }}
    >
      <div className="container mx-auto px-4 py-3 md:py-4 relative overflow-visible">
        <div className="flex items-center justify-between relative overflow-visible">
          {/* Left - Logo and Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0 md:hidden"
              aria-label="Toggle menu"
              data-mobile-menu
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
          <div className="flex items-center gap-3 lg:gap-6 overflow-visible">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3 lg:gap-6">
            <div 
              ref={shopMegaMenuRef}
              className="relative"
              onMouseEnter={() => {
                setAboutMegaMenuOpen(false);
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
                  Shop
                </Link>
              </div>
              
            <div 
              ref={aboutMegaMenuRef}
              className="relative"
              onMouseEnter={() => {
                setShopMegaMenuOpen(false);
                setAboutMegaMenuOpen(true);
              }}
              onMouseOver={() => {
                // Prefetch API data on hover for faster loading
                fetch("/api/mega-menu-cards?menuType=ABOUT", { 
                  method: 'GET',
                  cache: 'force-cache'
                }).catch(() => {});
              }}
            >
              <Link href="/about" className="text-brand-white hover:text-brand-sweet-bianca transition-colors text-sm lg:text-base whitespace-nowrap">
                About
              </Link>
            </div>
            </div>

            {/* Desktop divider */}
            <div className="hidden md:block w-px h-6 bg-gray-700"></div>

            {/* Search Icon */}
            <button
              onClick={() => setSearchDrawerOpen(true)}
              className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0"
              aria-label="Search products"
            >
              <Search className="h-6 w-6" />
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
                    if (window.confirm("Are you sure you want to sign out?")) {
                      signOut();
                    }
                  }}
                  className="hidden md:inline-flex text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 text-sm lg:text-base whitespace-nowrap px-3 h-auto py-1"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login" className="text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0" title="Sign In">
                <User className="h-6 w-6" />
              </Link>
            )}

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-sweet-bianca text-brand-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="absolute top-full left-0 right-0 bg-brand-black border-t border-gray-800 md:hidden z-40"
            data-mobile-menu
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
              >
                Shop
              </Link>
              
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 transition-colors rounded"
              >
                About
              </Link>
              
              {session && (
                <div className="border-t border-gray-800 pt-3 mt-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to sign out?")) {
                        signOut();
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="w-full text-brand-white hover:text-brand-sweet-bianca hover:bg-gray-900 text-left justify-start px-4 py-3 h-auto"
                  >
                    Sign Out
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
        onMouseEnter={() => {
          setAboutMegaMenuOpen(false);
          setShopMegaMenuOpen(true);
        }}
      />
      <AboutMegaMenu 
        isOpen={aboutMegaMenuOpen} 
        onClose={() => setAboutMegaMenuOpen(false)}
        onMouseEnter={() => {
          setShopMegaMenuOpen(false);
          setAboutMegaMenuOpen(true);
        }}
      />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      <SearchDrawer isOpen={searchDrawerOpen} onClose={() => setSearchDrawerOpen(false)} />
    </nav>
  );
}

