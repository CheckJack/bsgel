"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SeoPageRow = {
  id: string;
  path: string;
  name: string;
  title: string | null;
  description: string | null;
  permalink: string | null;
  isDynamic: boolean;
  updatedAt: string;
};

export default function AdminSeoPagesList() {
  const [pages, setPages] = useState<SeoPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/site-seo?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPages(data.pages ?? []);
    } catch {
      toast("Failed to load pages", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(pages.length / perPage));
  const slice = pages.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard &gt; SEO</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page SEO</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage title tags, meta descriptions, permalinks, image alt text, and social images for every storefront page.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, path, or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>{pages.length} pages</span>
            <div className="flex items-center gap-2">
              <span>Per page</span>
              <select
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={perPage}
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-12 text-center text-gray-500">Loading…</p>
          ) : slice.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No pages found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-3 font-medium">Page</th>
                    <th className="p-3 font-medium">Path</th>
                    <th className="p-3 font-medium">SEO title</th>
                    <th className="p-3 font-medium">Permalink</th>
                    <th className="p-3 font-medium">Updated</th>
                    <th className="p-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {slice.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-3">
                        <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
                        {row.isDynamic && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">Dynamic template</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-600 dark:text-gray-400">{row.path}</td>
                      <td className="p-3 max-w-[200px] truncate text-gray-700 dark:text-gray-300">
                        {row.title || "—"}
                      </td>
                      <td className="p-3 font-mono text-xs">{row.permalink || row.path}</td>
                      <td className="p-3 text-gray-500">
                        {new Date(row.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/pages/edit?path=${encodeURIComponent(row.path)}`}>
                            <Pencil className="mr-1 size-3.5" />
                            Edit
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t pt-4">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border p-2 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border p-2 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
