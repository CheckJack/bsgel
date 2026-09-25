import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  BLOG_PRODUCT_GRID_ATTR,
  columnsForProductCount,
  formatProductIdsAttr,
  parseProductIdsAttr,
  type BlogProductGridAttrs,
} from "@/lib/blog-product-grid";
import { BlogProductGridNodeView } from "./blog-product-grid-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogProductGrid: {
      insertBlogProductGrid: (attrs: BlogProductGridAttrs) => ReturnType;
      updateBlogProductGrid: (attrs: BlogProductGridAttrs) => ReturnType;
    };
  }
}

function parseProductIds(raw: string | null): string[] {
  return parseProductIdsAttr(raw);
}

export const BlogProductGridExtension = Node.create({
  name: "blogProductGrid",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      productIds: {
        default: [],
        parseHTML: (element) => parseProductIds(element.getAttribute("data-product-ids")),
        renderHTML: (attributes) => ({
          "data-product-ids": formatProductIdsAttr(attributes.productIds ?? []),
        }),
      },
      columns: {
        default: 2,
        parseHTML: (element) => {
          const value = parseInt(element.getAttribute("data-columns") || "2", 10);
          return Number.isFinite(value) ? value : 2;
        },
        renderHTML: (attributes) => ({
          "data-columns": String(attributes.columns ?? 2),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${BLOG_PRODUCT_GRID_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [BLOG_PRODUCT_GRID_ATTR]: "",
        class: "blog-product-grid",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlogProductGridNodeView);
  },

  addCommands() {
    return {
      insertBlogProductGrid:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              productIds: attrs.productIds,
              columns: attrs.columns || columnsForProductCount(attrs.productIds.length || 2),
            },
          }),
      updateBlogProductGrid:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            productIds: attrs.productIds,
            columns: attrs.columns || columnsForProductCount(attrs.productIds.length || 2),
          }),
    };
  },
});
