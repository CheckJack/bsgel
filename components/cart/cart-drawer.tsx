"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string | null;
  featured?: boolean;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { items, isLoading, updateQuantity, removeItem, itemCount, addItem } = useCart();
  const { t } = useLanguage();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Wait for session to finish loading before showing content
  const isSessionLoading = sessionStatus === "loading";
  const isCartReady = !isSessionLoading && !isLoading;

  // Handle fade in/out effects with smooth transitions
  useEffect(() => {
    if (isOpen) {
      // Mount and trigger fade in
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      const fadeInTimer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(fadeInTimer);
    } else {
      // Trigger fade out - hide recommendations first
      setShowRecommendations(false);
      // Then fade out the main cart
      setIsVisible(false);
      // Unmount after fade out completes
      const fadeOutTimer = setTimeout(() => {
        setShouldRender(false);
      }, 400); // Match duration-[400ms]
      return () => clearTimeout(fadeOutTimer);
    }
  }, [isOpen]);

  // Show recommendations after cart animation completes - smoother timing
  useEffect(() => {
    if (isOpen && isVisible) {
      // Reset recommendations visibility when opening
      setShowRecommendations(false);
      // Show recommendations after cart drawer is fully open and visible
      // Wait for cart to be fully visible (400ms) + small delay for smooth transition
      const timer = setTimeout(() => {
        setShowRecommendations(true);
      }, 500); // Smooth delay after cart is visible
      return () => clearTimeout(timer);
    } else {
      setShowRecommendations(false);
    }
  }, [isOpen, isVisible]);

  // Fetch recommended products when cart opens
  useEffect(() => {
    if (isOpen) {
      const fetchRecommendedProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const cartProductIds = items.map((item) => item.product.id);
          let recommended: Product[] = [];

          // Get unique category IDs from cart items
          const categoryIds = Array.from(
            new Set(
              items
                .map((item) => item.product.categoryId)
                .filter((id): id is string => id !== null)
            )
          );

          // Strategy 1: Fetch products from cart item categories
          if (categoryIds.length > 0) {
            const categoryPromises = categoryIds.map((categoryId) =>
              fetch(`/api/products?categoryId=${categoryId}&limit=20`).then(async (res) => {
                if (res.ok) {
                  const data = await res.json();
                  // Handle both array and object with products property
                  return Array.isArray(data) ? data : (data.products || []);
                }
                return [];
              })
            );

            const categoryProductsArrays = await Promise.all(categoryPromises);
            // Flatten and mix products from all categories
            const allCategoryProducts = categoryProductsArrays.flat();
            
            // Remove duplicates by product ID
            const uniqueProducts = Array.from(
              new Map(allCategoryProducts.map((p: Product) => [p.id, p])).values()
            );

            // Filter out products already in cart
            recommended = uniqueProducts
              .filter((p: Product) => !cartProductIds.includes(p.id))
              .slice(0, 4);
          }

          // Strategy 2: If we don't have enough recommendations from categories, fill with featured products
          if (recommended.length < 4) {
            try {
              const res = await fetch("/api/products?featured=true&limit=20");
              if (res.ok) {
                const data = await res.json();
                const featuredProducts = Array.isArray(data) ? data : (data.products || []);
                const additionalProducts = featuredProducts
                  .filter(
                    (p: Product) =>
                      !cartProductIds.includes(p.id) &&
                      !recommended.some((r) => r.id === p.id)
                  )
                  .slice(0, 4 - recommended.length);
                recommended = [...recommended, ...additionalProducts];
              }
            } catch (error) {
              console.error("Failed to fetch featured products:", error);
            }
          }

          // Strategy 3: Final fallback to regular products if still not enough
          if (recommended.length < 4) {
            try {
              const res2 = await fetch("/api/products?limit=20");
              if (res2.ok) {
                const data = await res2.json();
                const allProducts = Array.isArray(data) ? data : (data.products || []);
                const additionalProducts = allProducts
                  .filter(
                    (p: Product) =>
                      !cartProductIds.includes(p.id) &&
                      !recommended.some((r) => r.id === p.id)
                  )
                  .slice(0, 4 - recommended.length);
                recommended = [...recommended, ...additionalProducts];
              }
            } catch (error) {
              console.error("Failed to fetch all products:", error);
            }
          }

          // Ensure we always have at least some recommendations (even if they're in cart, show them)
          if (recommended.length === 0) {
            try {
              const res3 = await fetch("/api/products?limit=4");
              if (res3.ok) {
                const data = await res3.json();
                const fallbackProducts = Array.isArray(data) ? data : (data.products || []);
                recommended = fallbackProducts.slice(0, 4);
              }
            } catch (error) {
              console.error("Failed to fetch fallback products:", error);
            }
          }

          setRecommendedProducts(recommended.slice(0, 4));
        } catch (error) {
          console.error("Failed to fetch recommended products:", error);
          // Even on error, try to get some products
          try {
            const res = await fetch("/api/products?limit=4");
            if (res.ok) {
              const data = await res.json();
              const fallbackProducts = Array.isArray(data) ? data : (data.products || []);
              setRecommendedProducts(fallbackProducts.slice(0, 4));
            }
          } catch (fallbackError) {
            console.error("Failed to fetch fallback products:", fallbackError);
            setRecommendedProducts([]);
          }
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchRecommendedProducts();
    }
  }, [isOpen, items]);

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

  if (!shouldRender) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  // Tax is calculated at checkout based on postal code
  // Not showing tax in cart drawer since we don't have postal code yet
  const total = subtotal;

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

      {/* Cart and Recommendations Container */}
      <div className="fixed top-0 right-0 h-full flex z-50">
        {/* Cart Drawer Slide Container */}
        <div
          className={`h-full flex transform transition-all duration-[400ms] ${
            isOpen && isVisible 
              ? "ease-out translate-x-0 opacity-100" 
              : "ease-in translate-x-full opacity-0"
          }`}
        >
        {/* You Might Like Container */}
        {isOpen && isVisible && (
          <div
            className={`hidden md:block w-[28rem] bg-white shadow-xl h-full transform transition-all duration-500 ${
              showRecommendations
                ? "ease-out translate-x-0 opacity-100"
                : "ease-in translate-x-full opacity-0"
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b bg-white">
                <h2 className="text-2xl font-bold text-brand-black m-0">You Might Like</h2>
                <button className="p-2 invisible" aria-hidden="true">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingProducts ? (
                  <div className="text-center py-8 text-gray-600">Loading products...</div>
                ) : recommendedProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <p>No recommendations available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-all duration-300 ease-out"
                        style={{
                          animation: showRecommendations ? `fadeInUp 0.3s ease-out ${index * 0.05}s both` : undefined
                        }}
                      >
                        <Link
                          href={`/products/${product.id}`}
                          onClick={onClose}
                          className="group flex gap-4 flex-1 min-w-0"
                        >
                          {product.image ? (
                            <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="96px"
                                className="object-contain rounded"
                                loading="eager"
                                unoptimized={product.image?.startsWith('data:') || product.image?.startsWith('blob:')}
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm group-hover:underline truncate mb-1">
                              {product.name}
                            </h4>
                            <p className="text-lg font-bold text-brand-black mb-1">
                              {formatPrice(product.price)}
                            </p>
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await addItem(product.id, 1);
                              }}
                              className="text-xs text-gray-600 hover:text-brand-black underline cursor-pointer"
                            >
                              {t("products.addToCart")}
                            </button>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {recommendedProducts.length > 0 && (
                <div className="p-6 border-t bg-white">
                  <Link href="/products" onClick={onClose}>
                    <Button variant="outline" className="w-full">
                      {t("common.viewAllProducts")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart Container */}
        <div className="h-full w-full max-w-full sm:max-w-md bg-white shadow-2xl">
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-black m-0">Your Cart</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close cart"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isSessionLoading || isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading cart...</div>
              ) : !session ? (
                <div className="text-center py-8">
                  <p className="text-lg mb-4 text-gray-600">Please sign in to view your cart.</p>
                  <Link href="/login" onClick={onClose}>
                    <Button>Sign In</Button>
                  </Link>
                </div>
              ) : isCartReady && itemCount === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg mb-6 text-gray-600">Your cart is empty.</p>
                  <Link href="/products" onClick={onClose}>
                    <Button>Continue Shopping</Button>
                  </Link>
                </div>
              ) : isCartReady && itemCount > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-all duration-300 ease-out"
                      style={{
                        animation: isVisible ? `fadeInUp 0.3s ease-out ${index * 0.03}s both` : undefined
                      }}
                    >
                      {item.product.image ? (
                        <Link
                          href={`/products/${item.product.id}`}
                          onClick={onClose}
                          className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden"
                        >
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-contain rounded"
                            priority
                            loading="eager"
                            unoptimized={item.product.image?.startsWith('data:') || item.product.image?.startsWith('blob:')}
                          />
                        </Link>
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.id}`}
                          onClick={onClose}
                          className="block"
                        >
                          <h3 className="font-semibold text-sm hover:underline truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm mb-2">
                          {formatPrice(item.product.price)}
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 sm:w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-between">
                        <p className="font-bold text-sm">
                          {formatPrice(parseFloat(item.product.price) * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 text-xs p-1 h-auto"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer with Summary */}
            {isCartReady && session && itemCount > 0 && (
              <div className="border-t p-4 sm:p-6 bg-gray-50 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    Tax will be calculated at checkout based on your shipping address
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-sm sm:text-base">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <Button
                  className="w-full touch-manipulation min-h-[44px]"
                  size="lg"
                  onClick={() => {
                    onClose();
                    router.push("/checkout");
                  }}
                >
                  Proceed to Checkout
                </Button>
                <Link href="/cart" onClick={onClose}>
                  <Button variant="outline" className="w-full touch-manipulation min-h-[44px]">
                    View Full Cart
                  </Button>
                </Link>
              </div>
            )}
        </div>
      </div>
        </div>
      </div>
    </>
  );
}

