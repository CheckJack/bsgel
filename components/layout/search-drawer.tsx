"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { X, Search, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
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

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-[400ms] ${
          isVisible ? "ease-out opacity-100" : "ease-in opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Drawer */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div
          className={`bg-black/80 backdrop-blur-md shadow-2xl transform transition-all duration-[400ms] ${
            isOpen && isVisible
              ? "ease-out translate-y-0 opacity-100"
              : "ease-in -translate-y-full opacity-0"
          }`}
        >
          <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white m-0">Search Products</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Close search"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg bg-white/10 backdrop-blur-sm text-white border-gray-600/50 focus:border-brand-sweet-bianca/60 focus-visible:ring-brand-sweet-bianca/40 placeholder:text-gray-400"
              />
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto search-results-scroll pr-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white">Searching...</span>
                </div>
              ) : searchQuery.trim() === "" ? (
                <div className="text-center py-12 text-white">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Start typing to search for products</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-white">
                  <p className="text-lg mb-2">No products found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 pr-1">
                    {products.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex gap-4 p-4 border border-gray-700 rounded-lg hover:bg-gray-900 transition-all cursor-pointer"
                        onClick={() => handleProductClick(product.id)}
                        style={{
                          animation: isVisible
                            ? `fadeInUp 0.3s ease-out ${index * 0.03}s both`
                            : undefined,
                        }}
                      >
                        <div className="flex-shrink-0 w-24 self-stretch">
                          {product.image ? (
                            <div className="relative w-full h-full bg-gray-800 rounded overflow-hidden">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <h3 className="font-semibold text-base text-white hover:underline truncate mb-1">
                            {product.name}
                          </h3>
                          {product.category && (
                            <p className="text-sm text-gray-400 mb-2">
                              {product.category.name}
                            </p>
                          )}
                          {product.description && (
                            <p className="text-sm text-gray-300 line-clamp-2 mb-2 flex-1">
                              {product.description}
                            </p>
                          )}
                          <p className="text-lg font-bold text-white">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {products.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <Button
                        variant="outline"
                        className="w-full border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800"
                        onClick={handleViewAllResults}
                      >
                        View All Results ({products.length})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

