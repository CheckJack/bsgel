"use client";

import { useEffect, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogProductGridCards } from "@/components/blog/blog-product-grid-cards";
import { BlogProductGridDialog } from "@/components/admin/blog-product-grid-dialog";
import type { BlogProductSummary } from "@/components/blog/blog-product-grid-cards";

export function BlogProductGridNodeView({ node, deleteNode, editor, updateAttributes }: NodeViewProps) {
  const productIds = (node.attrs.productIds as string[]) ?? [];
  const columns = (node.attrs.columns as number) ?? 2;
  const [products, setProducts] = useState<BlogProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const productIdsKey = productIds.join(",");

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/products/by-ids?ids=${encodeURIComponent(productIdsKey)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productIds, productIdsKey]);

  return (
    <NodeViewWrapper className="blog-product-grid-node my-6" data-drag-handle>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/40">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
            <LayoutGrid className="size-3.5" aria-hidden />
            Product grid ({productIds.length})
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="size-3.5" />
              <span className="sr-only">Edit product grid</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-red-600 hover:text-red-700"
              onClick={deleteNode}
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Remove product grid</span>
            </Button>
          </div>
        </div>

        <div className="p-3">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading products…</p>
          ) : productIds.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No products selected. Click edit to add products.
            </p>
          ) : (
            <BlogProductGridCards products={products} columns={columns} preview />
          )}
        </div>
      </div>

      <BlogProductGridDialog
        open={showEditDialog}
        initialProductIds={productIds}
        initialColumns={columns}
        onClose={() => setShowEditDialog(false)}
        onConfirm={(nextProductIds, nextColumns) => {
          updateAttributes({
            productIds: nextProductIds,
            columns: nextColumns,
          });
          setShowEditDialog(false);
          editor.commands.focus();
        }}
      />
    </NodeViewWrapper>
  );
}
