"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  columnsForProductCount,
  MAX_BLOG_PRODUCT_GRID_COUNT,
  MIN_BLOG_PRODUCT_GRID_COUNT,
} from "@/lib/blog-product-grid";
import type { BlogProductSummary } from "@/components/blog/blog-product-grid-cards";
import { useLanguage } from "@/contexts/language-context";

type BlogProductGridDialogProps = {
  open: boolean;
  initialProductIds?: string[];
  initialColumns?: number;
  onClose: () => void;
  onConfirm: (productIds: string[], columns: number) => void;
};

type SlotSelection = {
  productId: string;
  product: BlogProductSummary;
} | null;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function BlogProductGridDialog({
  open,
  initialProductIds = [],
  initialColumns,
  onClose,
  onConfirm,
}: BlogProductGridDialogProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"count" | "products">("count");
  const [productCount, setProductCount] = useState(
    Math.max(MIN_BLOG_PRODUCT_GRID_COUNT, initialProductIds.length || 2)
  );
  const [slots, setSlots] = useState<SlotSelection[]>([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BlogProductSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const countOptions = useMemo(
    () => Array.from({ length: MAX_BLOG_PRODUCT_GRID_COUNT }, (_, index) => index + 1),
    []
  );

  useEffect(() => {
    if (!open) return;

    const count = Math.max(
      MIN_BLOG_PRODUCT_GRID_COUNT,
      Math.min(MAX_BLOG_PRODUCT_GRID_COUNT, initialProductIds.length || 2)
    );
    setProductCount(count);
    setStep(initialProductIds.length > 0 ? "products" : "count");
    setActiveSlot(0);
    setSearchQuery("");
    setSearchResults([]);

    if (initialProductIds.length === 0) {
      setSlots(Array.from({ length: count }, () => null));
      return;
    }

    let cancelled = false;
    setIsLoadingInitial(true);

    fetch(`/api/products/by-ids?ids=${encodeURIComponent(initialProductIds.join(","))}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BlogProductSummary[]) => {
        if (cancelled) return;
        const byId = new Map((Array.isArray(data) ? data : []).map((product) => [product.id, product]));
        setSlots(
          initialProductIds.map((id) => {
            const product = byId.get(id);
            return product ? { productId: id, product } : null;
          })
        );
        if (initialProductIds.length !== count) {
          setProductCount(initialProductIds.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlots(Array.from({ length: count }, () => null));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInitial(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, initialProductIds.join(","), initialColumns]);

  useEffect(() => {
    if (!open || step !== "products" || debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    fetch(`/api/products?search=${encodeURIComponent(debouncedSearch.trim())}&limit=8`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const products = Array.isArray(data) ? data : data?.products ?? [];
        setSearchResults(products);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, open, step]);

  if (!open) return null;

  const handleCountContinue = () => {
    setSlots((current) => {
      const next = Array.from({ length: productCount }, (_, index) => current[index] ?? null);
      return next;
    });
    setActiveSlot(0);
    setStep("products");
  };

  const handleSelectProduct = (product: BlogProductSummary) => {
    setSlots((current) => {
      const next = [...current];
      next[activeSlot] = { productId: product.id, product };
      return next;
    });
    setSearchQuery("");
    setSearchResults([]);

    const nextEmpty = slots.findIndex((slot, index) => index > activeSlot && !slot);
    if (nextEmpty >= 0) {
      setActiveSlot(nextEmpty);
    } else if (activeSlot < productCount - 1) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleConfirm = () => {
    const productIds = slots
      .map((slot) => slot?.productId)
      .filter((id): id is string => Boolean(id));

    if (productIds.length === 0) {
      window.alert("Select at least one product for the grid.");
      return;
    }

    onConfirm(productIds, columnsForProductCount(productIds.length));
  };

  const selectedIds = new Set(slots.map((slot) => slot?.productId).filter(Boolean) as string[]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-product-grid-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 id="blog-product-grid-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {step === "count" ? "Add product grid" : "Choose products"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {step === "count"
                ? "How many products should appear in this grid?"
                : "Search and assign a product to each slot."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "count" ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {countOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setProductCount(count)}
                  className={`rounded-lg border px-4 py-6 text-center transition-colors ${
                    productCount === count
                      ? "border-pink-900 bg-pink-50 text-pink-900 dark:bg-pink-950/30"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <span className="block text-2xl font-semibold">{count}</span>
                  <span className="mt-1 block text-xs uppercase tracking-wide text-gray-500">
                    {count === 1 ? "product" : "products"}
                  </span>
                </button>
              ))}
            </div>
          ) : isLoadingInitial ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading products…
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: productCount }).map((_, index) => {
                  const slot = slots[index];
                  const isActive = activeSlot === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setActiveSlot(index);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        isActive
                          ? "border-pink-900 ring-1 ring-pink-900"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        Slot {index + 1}
                      </p>
                      {slot ? (
                        <div className="mt-2">
                          {slot.product.image ? (
                            <div className="mb-2 flex h-24 items-center justify-center rounded bg-gray-50 p-2 dark:bg-gray-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={slot.product.image}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          ) : null}
                          <p className="line-clamp-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                            {slot.product.name}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-gray-400">Tap to add product</p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search products for slot {activeSlot + 1}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Type product name…"
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Type at least 2 characters to search.</p>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Searching…
                  </div>
                ) : debouncedSearch.trim().length < 2 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">Start typing to search products.</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No products found.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {searchResults.map((product) => {
                      const alreadySelected = selectedIds.has(product.id);
                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            disabled={alreadySelected && slots[activeSlot]?.productId !== product.id}
                            onClick={() => handleSelectProduct(product)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
                          >
                            {product.image ? (
                              <div className="flex size-14 shrink-0 items-center justify-center rounded bg-gray-50 p-1 dark:bg-gray-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.image}
                                  alt=""
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="size-14 shrink-0 rounded bg-gray-100 dark:bg-gray-800" />
                            )}
                            <span className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {product.name}
                              {alreadySelected && slots[activeSlot]?.productId !== product.id ? " (already used)" : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <div>
            {step === "products" && (
              <Button type="button" variant="outline" onClick={() => setStep("count")}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {step === "count" ? (
              <Button type="button" onClick={handleCountContinue}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleConfirm}>
                Insert grid
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
