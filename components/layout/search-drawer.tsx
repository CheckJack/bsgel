"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, stripHtml } from "@/lib/utils";
import { X, Search, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/language-context";
import { setAppScrollLocked } from "@/lib/mobile-scroll-root";

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string | null;
  description: string | null;
  category: {
    id: string;
    name: string;
  } | null;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle fade in/out effects with smooth transitions
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const fadeInTimer = setTimeout(() => {
        setIsVisible(true);
        // Focus input when drawer opens
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }, 10);
      return () => clearTimeout(fadeInTimer);
    } else {
      setIsVisible(false);
      const fadeOutTimer = setTimeout(() => {
        setShouldRender(false);
        setSearchQuery("");
        setProducts([]);
      }, 400);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Handle both array and paginated response formats
          const productList = Array.isArray(data) ? data : (data.products || []);
          setProducts(productList);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to search products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      setAppScrollLocked(true);
      document.body.style.overflow = "hidden";
    } else {
      setAppScrollLocked(false);
      document.body.style.overflow = "unset";
    }
    return () => {
      setAppScrollLocked(false);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleProductClick = (productId: string) => {
    onClose();
    router.push(`/products/${productId}`);
  };

  const handleViewAllResults = () => {
    onClose();
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[1500] max-lg:ios-overlay-bleed ${isVisible ? "" : "pointer-events-none"}`}
      aria-hidden={!isVisible}
    >
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-[400ms] max-lg:hidden ${
          isVisible ? "ease-out opacity-100" : "ease-in opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 top-0 max-lg:inset-0">
        <div
          className={`bg-brand-white shadow-2xl transform transition-all duration-[400ms] lg:border-b lg:border-black/10 max-lg:flex max-lg:h-full max-lg:min-h-[var(--ios-viewport-height,100lvh)] max-lg:flex-col ${
            isOpen && isVisible
              ? "ease-out translate-y-0 opacity-100"
              : "ease-in -translate-y-full opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="container mx-auto flex min-h-0 flex-1 flex-col px-4 py-6 max-lg:h-full lg:block">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display m-0 text-3xl font-normal tracking-tight text-brand-black md:text-4xl">{t("search.title")}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Close search"
              >
                <X className="h-6 w-6 text-brand-black" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-black/40 z-10" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg bg-brand-white text-brand-black border-black/15 focus:border-brand-champagne focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-brand-black/40"
              />
            </div>

            {/* Results */}
            <div className="min-h-0 flex-1 overflow-y-auto search-results-scroll pr-3 lg:max-h-[60vh] lg:flex-none">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-black" />
                  <span className="ml-2 text-brand-black">
                    {language === "pt" ? "A pesquisar..." : "Searching..."}
                  </span>
                </div>
              ) : searchQuery.trim() === "" ? (
                <div className="text-center py-12 text-brand-black/70">
                  <Search className="h-12 w-12 mx-auto mb-4 text-brand-black/30" />
                  <p className="text-lg">{t("search.startTyping")}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-brand-black/70">
                  <p className="text-lg mb-2">{t("search.noResults")}</p>
                  <p className="text-sm text-brand-black/50">Try a different search term</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 pr-1">
                    {products.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 border border-black/10 rounded-lg px-3 py-2.5 hover:bg-black/[0.03] transition-all cursor-pointer"
                        onClick={() => handleProductClick(product.id)}
                        style={{
                          animation: isVisible
                            ? `fadeInUp 0.3s ease-out ${index * 0.03}s both`
                            : undefined,
                        }}
                      >
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={400}
                            height={400}
                            sizes="144px"
                            unoptimized={product.image.startsWith("data:")}
                            className="h-36 w-36 shrink-0 object-contain rounded-lg"
                            style={{
                              overflow: "hidden",
                              borderRadius: "0.5rem",
                            }}
                          />
                        ) : (
                          <span className="flex h-36 w-36 shrink-0 items-center justify-center rounded-lg text-center text-gray-500 text-xs">
                            No Image
                          </span>
                        )}

                        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1">
                          <h3 className="truncate font-semibold text-sm leading-snug text-brand-black hover:underline sm:text-base">
                            {product.name}
                          </h3>
                          {product.category && (
                            <p className="text-xs text-brand-black/50 leading-tight">
                              {product.category.name}
                            </p>
                          )}
                          {product.description && (
                            <p className="line-clamp-1 text-xs leading-snug text-brand-black/60 sm:text-sm">
                              {stripHtml(product.description)}
                            </p>
                          )}
                          <p className="text-base font-bold leading-tight text-brand-black">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {products.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-black/10">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleViewAllResults}
                      >
                        {t("search.viewAllResults")} ({products.length})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

