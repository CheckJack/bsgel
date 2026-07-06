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
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/language-context";
import { setAppScrollLocked, syncIosViewportHeight } from "@/lib/mobile-scroll-root";
import { toast } from "@/components/ui/toast";

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

const RECOMMENDATION_COUNT = 6;

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { items, trainingItems, isLoading, updateQuantity, removeItem, removeTrainingItem, itemCount, addItem } = useCart();
  const { t, language } = useLanguage();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSessionLoading = sessionStatus === "loading";
  const isCartReady = !isSessionLoading && !isLoading;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const fadeInTimer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(fadeInTimer);
    }

    setShowRecommendations(false);
    setIsVisible(false);
    const fadeOutTimer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(fadeOutTimer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isVisible) {
      setShowRecommendations(false);
      const timer = setTimeout(() => setShowRecommendations(true), 350);
      return () => clearTimeout(timer);
    }

    setShowRecommendations(false);
  }, [isOpen, isVisible]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRecommendedProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const cartProductIds = items.map((item) => item.product.id);
        let recommended: Product[] = [];

        try {
          const restockedRes = await fetch("/api/stock-alerts/restocked");
          if (restockedRes.ok) {
            const restockedData = await restockedRes.json();
            recommended.push(
              ...(restockedData.products || []).filter(
                (p: Product) => !cartProductIds.includes(p.id)
              )
            );
          }
        } catch {
          /* ignore */
        }

        const categoryIds = Array.from(
          new Set(
            items
              .map((item) => item.product.categoryId)
              .filter((id): id is string => id !== null)
          )
        );

        if (categoryIds.length > 0) {
          const categoryProductsArrays = await Promise.all(
            categoryIds.map((categoryId) =>
              fetch(`/api/products?categoryId=${categoryId}&limit=20`).then(async (res) => {
                if (!res.ok) return [];
                const data = await res.json();
                return Array.isArray(data) ? data : data.products || [];
              })
            )
          );

          recommended = Array.from(
            new Map(categoryProductsArrays.flat().map((p: Product) => [p.id, p])).values()
          )
            .filter((p: Product) => !cartProductIds.includes(p.id))
            .slice(0, RECOMMENDATION_COUNT);
        }

        if (recommended.length < RECOMMENDATION_COUNT) {
          const res = await fetch("/api/products?featured=true&limit=30");
          if (res.ok) {
            const data = await res.json();
            const featuredProducts = Array.isArray(data) ? data : data.products || [];
            recommended = [
              ...recommended,
              ...featuredProducts
                .filter(
                  (p: Product) =>
                    !cartProductIds.includes(p.id) && !recommended.some((r) => r.id === p.id)
                )
                .slice(0, RECOMMENDATION_COUNT - recommended.length),
            ];
          }
        }

        if (recommended.length === 0) {
          const res = await fetch(`/api/products?limit=${RECOMMENDATION_COUNT}`);
          if (res.ok) {
            const data = await res.json();
            const fallbackProducts = Array.isArray(data) ? data : data.products || [];
            recommended = fallbackProducts.slice(0, RECOMMENDATION_COUNT);
          }
        }

        setRecommendedProducts(recommended.slice(0, RECOMMENDATION_COUNT));
      } catch (error) {
        console.error("Failed to fetch recommended products:", error);
        setRecommendedProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    void fetchRecommendedProducts();
  }, [isOpen, items]);

  useEffect(() => {
    if (isOpen) {
      setAppScrollLocked(true);
      document.body.style.overflow = "hidden";
    } else {
      setAppScrollLocked(false);
      document.body.style.overflow = "";
      document.documentElement.style.removeProperty("--cart-drawer-height");
    }

    return () => {
      setAppScrollLocked(false);
      document.body.style.overflow = "";
      document.documentElement.style.removeProperty("--cart-drawer-height");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const syncCartDrawerHeight = () => {
      if (!window.matchMedia("(max-width: 1023px)").matches) return;

      syncIosViewportHeight();
      const vv = window.visualViewport;
      const visibleHeight = vv
        ? Math.round(vv.height + vv.offsetTop)
        : Math.min(window.innerHeight, document.documentElement.clientHeight);
      document.documentElement.style.setProperty(
        "--cart-drawer-height",
        `calc(${visibleHeight}px - var(--site-header-height, 113px))`
      );
    };

    syncCartDrawerHeight();
    window.addEventListener("resize", syncCartDrawerHeight, { passive: true });
    window.visualViewport?.addEventListener("resize", syncCartDrawerHeight, { passive: true });
    window.visualViewport?.addEventListener("scroll", syncCartDrawerHeight, { passive: true });

    return () => {
      window.removeEventListener("resize", syncCartDrawerHeight);
      window.visualViewport?.removeEventListener("resize", syncCartDrawerHeight);
      window.visualViewport?.removeEventListener("scroll", syncCartDrawerHeight);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender || !mounted) return null;

  const subtotal =
    items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0) +
    trainingItems.reduce((sum, item) => sum + parseFloat(item.program.price), 0);

  const formatTrainingSessionDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "pt" ? "pt-PT" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return createPortal(
    <div
      className={`pointer-events-none fixed inset-0 z-[1500] max-lg:z-[1300]`}
      aria-hidden={!isVisible}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 top-[var(--site-header-height,113px)] bg-black/40 transition-opacity duration-300 ${
          isVisible ? "pointer-events-auto opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`pointer-events-none absolute inset-y-0 right-0 flex h-dvh max-w-full transform transition-transform duration-300 ease-out max-lg:inset-x-0 max-lg:top-[var(--site-header-height,113px)] max-lg:h-[var(--cart-drawer-height,calc(100svh-var(--site-header-height,113px)))] max-lg:w-full ${
          isOpen && isVisible ? "pointer-events-auto translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full w-full bg-white shadow-[(-2px)_0_16px_rgba(0,0,0,0.06)] max-lg:shadow-none lg:w-auto">
          {isOpen && isVisible && (
            <div
              className={`hidden h-full w-[22rem] border-r border-gray-100 bg-white xl:block 2xl:w-[26rem] ${
                showRecommendations ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300`}
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-gray-200 px-5">
                  <h2 className="text-lg font-semibold leading-none text-brand-black">{t("cart.youMightLike")}</h2>
                  <div className="size-9 shrink-0" aria-hidden />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {isLoadingProducts ? (
                    <p className="py-8 text-center text-sm text-gray-500">{t("cart.loadingProducts")}</p>
                  ) : recommendedProducts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">{t("cart.noRecommendations")}</p>
                  ) : (
                    <div className="space-y-4">
                      {recommendedProducts.map((product) => (
                        <div key={product.id} className="flex gap-3 border-b border-gray-100 pb-4 last:border-0">
                          <Link
                            href={`/products/${product.id}`}
                            onClick={onClose}
                            className="group flex min-w-0 flex-1 gap-3"
                          >
                            {product.image ? (
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="64px"
                                  className="object-contain"
                                  unoptimized={
                                    product.image.startsWith("data:") || product.image.startsWith("blob:")
                                  }
                                />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                                {t("cart.noImage")}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-medium text-brand-black group-hover:underline">
                                {product.name}
                              </h4>
                              <p className="mt-1 text-sm font-semibold text-brand-black">
                                {formatPrice(product.price)}
                              </p>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const ok = await addItem(product.id, 1);
                                  if (!ok) toast(t("cart.addFailed"), "error");
                                }}
                                className="mt-1 text-xs text-gray-600 underline hover:text-brand-black"
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
              </div>
            </div>
          )}

          <div className="flex h-full w-full flex-col bg-white lg:w-[min(100vw,24rem)] xl:w-[28rem]">
            <div className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-gray-200 px-5">
              <h2 className="text-lg font-semibold leading-none text-brand-black">{t("cart.title")}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-brand-black transition-colors hover:bg-gray-100"
                aria-label={t("cart.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {isSessionLoading || isLoading ? (
                <p className="py-8 text-center text-sm text-gray-500">{t("cart.loadingCart")}</p>
              ) : !session ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-gray-600">{t("cart.pleaseSignIn")}</p>
                  <Link href="/login" onClick={onClose}>
                    <Button>{t("cart.signIn")}</Button>
                  </Link>
                </div>
              ) : isCartReady && itemCount === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-gray-600">{t("cart.empty")}</p>
                  <Link href="/products" onClick={onClose}>
                    <Button variant="outline">{t("cart.continueShopping")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {trainingItems.map((item) => (
                    <div key={item.id} className="flex gap-3 py-4 first:pt-0">
                      {item.program.image ? (
                        <Link
                          href={`/training/${item.program.id}`}
                          onClick={onClose}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100"
                        >
                          <Image
                            src={item.program.image}
                            alt={item.program.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized={
                              item.program.image.startsWith("data:") ||
                              item.program.image.startsWith("blob:")
                            }
                          />
                        </Link>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-brand-champagne/15 text-xs font-medium text-brand-champagne">
                          {t("cart.trainingBadge")}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/training/${item.program.id}`}
                          onClick={onClose}
                          className="line-clamp-2 text-sm font-medium text-brand-black hover:underline"
                        >
                          {item.program.title}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">{t("cart.trainingProgram")}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatTrainingSessionDate(item.session.startDate)}
                          {item.session.location ? ` · ${item.session.location}` : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between">
                        <p className="text-sm font-semibold text-brand-black">
                          {formatPrice(item.program.price)}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeTrainingItem(item.id);
                          }}
                          className="relative z-10 text-xs text-red-600 hover:text-red-700"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  ))}

                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-4 first:pt-0">
                      {item.product.image ? (
                        <Link
                          href={`/products/${item.product.id}`}
                          onClick={onClose}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100"
                        >
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="64px"
                            className="object-contain"
                            unoptimized={
                              item.product.image.startsWith("data:") ||
                              item.product.image.startsWith("blob:")
                            }
                          />
                        </Link>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                          {t("cart.noImage")}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product.id}`}
                          onClick={onClose}
                          className="line-clamp-2 text-sm font-medium text-brand-black hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500">{formatPrice(item.product.price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between">
                        <p className="text-sm font-semibold text-brand-black">
                          {formatPrice(parseFloat(item.product.price) * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeItem(item.id);
                          }}
                          className="relative z-10 text-xs text-red-600 hover:text-red-700"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isCartReady && session && itemCount > 0 && (
              <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 max-lg:pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-black">{t("cart.subtotal")}</span>
                  <span className="text-base font-semibold text-brand-black">{formatPrice(subtotal)}</span>
                </div>
                <p className="mb-4 text-xs text-gray-500">{t("cart.taxAtCheckout")}</p>
                <div className="space-y-2">
                  <Button
                    className="h-11 w-full bg-brand-black hover:bg-brand-black/90"
                    onClick={() => {
                      onClose();
                      router.push("/checkout");
                    }}
                  >
                    {t("cart.proceedToCheckout")}
                  </Button>
                  <Link href="/cart" onClick={onClose} className="block">
                    <Button variant="outline" className="h-11 w-full">
                      {t("cart.viewFullCart")}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
