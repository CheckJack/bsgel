"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { parseBlogContent } from "@/lib/blog-product-grid";
import { BlogProductGridCards, type BlogProductSummary } from "@/components/blog/blog-product-grid-cards";

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
    "code",
    "pre",
    "hr",
    "div",
    "span",
    "mark",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel"],
};

type BlogRichContentProps = {
  content: string;
};

function BlogProductGridBlock({
  productIds,
  columns,
}: {
  productIds: string[];
  columns: number;
}) {
  const [products, setProducts] = useState<BlogProductSummary[]>([]);

  const productIdsKey = productIds.join(",");

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    fetch(`/api/products/by-ids?ids=${encodeURIComponent(productIdsKey)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [productIds, productIdsKey]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="blog-product-grid-embed my-8 not-prose">
      <BlogProductGridCards products={products} columns={columns} />
    </div>
  );
}

export function BlogRichContent({ content }: BlogRichContentProps) {
  const parts = useMemo(() => parseBlogContent(content || ""), [content]);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "html") {
          if (!part.content.trim()) return null;
          return (
            <div
              key={`html-${index}`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(part.content, SANITIZE_OPTIONS),
              }}
            />
          );
        }

        return (
          <BlogProductGridBlock
            key={`grid-${index}-${part.productIds.join("-")}`}
            productIds={part.productIds}
            columns={part.columns}
          />
        );
      })}
    </>
  );
}
