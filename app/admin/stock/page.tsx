"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Package, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/utils";
import { formatPrice, cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

type StockProduct = {
  id: string;
  name: string;
  image: string | null;
  hasImage?: boolean;
  price: string;
  salePrice: string | null;
  stockQuantity: number;
  outOfStock: boolean;
  featured: boolean;
  showcasingSections: string[];
  category: { id: string; name: string } | null;
};

type Category = { id: string; name: string };

function stockStatusLabel(qty: number, t: (k: string) => string) {
  if (qty <= 0) return { label: t("admin.stock.statusOut"), className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
  if (qty <= 2) return { label: t("admin.stock.statusLow"), className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  return { label: t("admin.stock.statusIn"), className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
}

function StockManagementContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const hasLoadedOnce = useRef(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [urgent, setUrgent] = useState(searchParams.get("urgent") === "true");
  const [featured, setFeatured] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkQty, setBulkQty] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<(StockProduct & { description?: string | null }) | null>(null);
  const [detailStock, setDetailStock] = useState("");
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(tmr);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedSearch, categoryId, stockStatus, urgent, featured]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/stock/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories ?? []);
        }
      } catch {
        /* categories are non-blocking */
      }
    })();
  }, []);

  const fetchProducts = useCallback(
    async (silent = false) => {
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;

      if (!hasLoadedOnce.current) {
        setLoading(true);
      } else if (!silent) {
        setRefreshing(true);
      }

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (categoryId) params.set("categoryId", categoryId);
        if (stockStatus) params.set("stockStatus", stockStatus);
        if (urgent) params.set("urgent", "true");
        if (featured) params.set("featured", featured);
        params.set("page", String(page));
        params.set("limit", String(limit));
        const res = await fetch(`/api/admin/stock?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages ?? 1);
        hasLoadedOnce.current = true;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast(t("admin.stock.loadError"), "error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [debouncedSearch, categoryId, stockStatus, urgent, featured, page, limit, t]
  );

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const saveStock = async (productId: string, qty: number) => {
    try {
      const res = await fetch(`/api/admin/stock/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: qty }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      const data = await res.json();
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                stockQuantity: data.stockQuantity,
                outOfStock: data.outOfStock ?? data.stockQuantity <= 0,
              }
            : p
        )
      );
      if (detailId === productId) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                stockQuantity: data.stockQuantity,
                outOfStock: data.outOfStock ?? data.stockQuantity <= 0,
              }
            : prev
        );
        setDetailStock(String(data.stockQuantity));
      }
      toast(t("admin.stock.updateSuccess"), "success");
      void fetchProducts(true);
      return true;
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t("admin.stock.updateError"), "error");
      return false;
    }
  };

  const handleInlineKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, product: StockProduct) => {
    if (e.key !== "Enter") return;
    const val = parseInt(editingStock[product.id] ?? String(product.stockQuantity), 10);
    if (Number.isNaN(val) || val < 0) {
      toast(t("admin.stock.invalidQty"), "error");
      return;
    }
    await saveStock(product.id, val);
    setEditingStock((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  };

  const openDetail = (product: StockProduct) => {
    setDetailId(product.id);
    setDetail({ ...product, description: null });
    setDetailStock(String(product.stockQuantity));
    void (async () => {
      try {
        const res = await fetch(`/api/admin/stock/${product.id}`);
        if (!res.ok) throw new Error();
        const p = await res.json();
        setDetail(p);
        setDetailStock(String(p.stockQuantity));
      } catch {
        toast(t("admin.stock.loadError"), "error");
      }
    })();
  };

  const handleBulkSave = async () => {
    const qty = parseInt(bulkQty, 10);
    if (Number.isNaN(qty) || qty < 0 || selected.size === 0) {
      toast(t("admin.stock.invalidBulk"), "error");
      return;
    }
    try {
      const res = await fetch("/api/admin/stock/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selected), stockQuantity: qty }),
      });
      if (!res.ok) throw new Error();
      toast(t("admin.stock.bulkSuccess"), "success");
      setSelected(new Set());
      setShowBulk(false);
      setBulkQty("");
      void fetchProducts(true);
    } catch {
      toast(t("admin.stock.updateError"), "error");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("admin.stock.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin.stock.subtitle")}</p>
        </div>
        <Button
          variant={urgent ? "default" : "outline"}
          className={cn(urgent && "bg-amber-600 hover:bg-amber-700")}
          onClick={() => setUrgent((u) => !u)}
        >
          <AlertTriangle className="mr-2 size-4" />
          {t("admin.stock.urgent")}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder={t("admin.stock.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t("admin.stock.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={stockStatus}
              onChange={(e) => { setStockStatus(e.target.value); setUrgent(false); }}
            >
              <option value="">{t("admin.stock.allStock")}</option>
              <option value="out">{t("admin.stock.filterOut")}</option>
              <option value="low">{t("admin.stock.filterLow")}</option>
              <option value="in">{t("admin.stock.filterIn")}</option>
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={featured}
              onChange={(e) => setFeatured(e.target.value)}
            >
              <option value="">{t("admin.stock.allFeatured")}</option>
              <option value="true">{t("admin.stock.featuredOnly")}</option>
              <option value="false">{t("admin.stock.notFeatured")}</option>
            </select>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <span className="text-sm">{t("admin.stock.selected").replace("{n}", String(selected.size))}</span>
              <Button size="sm" onClick={() => setShowBulk(true)}>{t("admin.stock.bulkEdit")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>{t("admin.stock.clearSelection")}</Button>
            </div>
          )}

          {showBulk && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border p-4">
              <div>
                <label className="mb-1 block text-xs font-medium">{t("admin.stock.setStockTo")}</label>
                <Input type="number" min={0} value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} className="w-32" />
              </div>
              <Button onClick={handleBulkSave}>{t("admin.stock.apply")}</Button>
              <Button variant="ghost" onClick={() => setShowBulk(false)}>{t("admin.stock.cancel")}</Button>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {total} {t("admin.stock.productsCount")}
              {total > 0 && (
                <>
                  {" · "}
                  {t("table.showing")} {(page - 1) * limit + 1} {t("table.to")}{" "}
                  {Math.min(page * limit, total)} {t("table.of")} {total}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="stock-page-size" className="text-xs text-gray-500">
                {t("table.entriesPerPage")}
              </label>
              <select
                id="stock-page-size"
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              >
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">{t("admin.stock.loading")}</p>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("admin.stock.noProducts")}</p>
          ) : (
            <div
              className={cn(
                "overflow-x-auto transition-opacity",
                refreshing && "pointer-events-none opacity-60"
              )}
            >
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="w-10 p-2" />
                    <th className="p-2">{t("admin.stock.colProduct")}</th>
                    <th className="p-2">{t("admin.stock.colCategory")}</th>
                    <th className="p-2">{t("admin.stock.colPrice")}</th>
                    <th className="p-2">{t("admin.stock.colStock")}</th>
                    <th className="p-2">{t("admin.stock.colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const status = stockStatusLabel(product.stockQuantity, t);
                    const displayVal = editingStock[product.id] ?? String(product.stockQuantity);
                    return (
                      <tr
                        key={product.id}
                        className="cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => openDetail(product)}
                      >
                        <td className="p-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-3">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded bg-gray-100">
                              {product.image ? (
                                <Image src={product.image} alt="" fill className="object-cover" sizes="40px" />
                              ) : (
                                <Package className="m-2 size-6 text-gray-400" />
                              )}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">{product.category?.name ?? "—"}</td>
                        <td className="p-2">{formatPrice(product.salePrice || product.price)}</td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="number"
                            min={0}
                            className="w-24"
                            value={displayVal}
                            onChange={(e) => setEditingStock((prev) => ({ ...prev, [product.id]: e.target.value }))}
                            onKeyDown={(e) => handleInlineKeyDown(e, product)}
                          />
                        </td>
                        <td className="p-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && products.length > 0 && totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("table.page")} {page} {t("table.of")} {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  aria-label={t("table.previous")}
                >
                  <ChevronLeft className="size-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                  )
                  .map((p, idx, arr) => (
                    <div key={p} className="flex items-center gap-1">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-gray-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={cn(
                          "min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          page === p
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        )}
                      >
                        {p}
                      </button>
                    </div>
                  ))}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  aria-label={t("table.next")}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {detailId && detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDetailId(null)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-semibold">{detail.name}</h2>
              <button type="button" onClick={() => setDetailId(null)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            {detail.image && (
              <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                <Image src={detail.image} alt={detail.name} fill className="object-contain" unoptimized={detail.image.startsWith("data:")} />
              </div>
            )}
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">{t("admin.stock.colCategory")}</dt><dd>{detail.category?.name ?? "—"}</dd></div>
              <div><dt className="text-gray-500">{t("admin.stock.colPrice")}</dt><dd>{formatPrice(detail.salePrice || detail.price)}</dd></div>
              {detail.description && (
                <div><dt className="text-gray-500">{t("admin.stock.description")}</dt><dd className="line-clamp-4">{detail.description}</dd></div>
              )}
            </dl>
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium">{t("admin.stock.colStock")}</label>
              <div className="flex gap-2">
                <Input type="number" min={0} value={detailStock} onChange={(e) => setDetailStock(e.target.value)} />
                <Button
                  onClick={async () => {
                    const val = parseInt(detailStock, 10);
                    if (!Number.isNaN(val) && val >= 0) await saveStock(detail.id, val);
                  }}
                >
                  {t("admin.stock.apply")}
                </Button>
              </div>
            </div>
            <Link href={`/admin/products/${detail.id}`} className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              {t("admin.stock.editProduct")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockManagementPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <StockManagementContent />
    </Suspense>
  );
}
