import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";

export const ADMIN_AI_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "get_dashboard_stats",
    description: "Get admin dashboard overview: products, orders, revenue, pending orders, urgent stock count.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "search_admin_logs",
    description: "Search admin activity logs.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        search: { type: SchemaType.STRING, description: "Search in description" },
        resourceType: { type: SchemaType.STRING },
        limit: { type: SchemaType.NUMBER },
      },
    },
  },
  {
    name: "list_products",
    description: "List or search products.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        search: { type: SchemaType.STRING },
        limit: { type: SchemaType.NUMBER },
        page: { type: SchemaType.NUMBER },
      },
    },
  },
  {
    name: "get_product",
    description: "Get full product details by ID.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { productId: { type: SchemaType.STRING } },
      required: ["productId"],
    },
  },
  {
    name: "search_products",
    description: "Search products by name (alias for list_products).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { search: { type: SchemaType.STRING } },
    },
  },
  {
    name: "list_stock",
    description: "List stock levels (paginated sample). Returns total count — use allProducts:true in bulk_update_stock for full-catalog updates.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        urgent: { type: SchemaType.BOOLEAN },
        search: { type: SchemaType.STRING },
        limit: { type: SchemaType.NUMBER },
      },
    },
  },
  {
    name: "update_product_stock",
    description: "Set exact stock quantity for one product.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productId: { type: SchemaType.STRING },
        stockQuantity: { type: SchemaType.NUMBER },
      },
      required: ["productId", "stockQuantity"],
    },
  },
  {
    name: "bulk_update_stock",
    description:
      "Set the same stock quantity for multiple products. For entire catalog or large batches (100+), use allProducts:true — the server resolves ALL matching IDs. Do not paginate list_stock and pass one page of IDs.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productIds: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Specific product IDs for small explicit lists only",
        },
        allProducts: {
          type: SchemaType.BOOLEAN,
          description: "When true, update ALL products (optionally filtered by search/category/urgent/outOfStock)",
        },
        search: { type: SchemaType.STRING, description: "Name filter when allProducts is true" },
        categoryId: { type: SchemaType.STRING },
        urgent: { type: SchemaType.BOOLEAN, description: "Only urgent stock (qty 1-2)" },
        outOfStock: { type: SchemaType.BOOLEAN, description: "Only out-of-stock products (qty 0)" },
        stockQuantity: { type: SchemaType.NUMBER },
      },
      required: ["stockQuantity"],
    },
  },
  {
    name: "add_incoming_stock",
    description: "Add incoming supplier order quantities to current stock (new = current + incoming).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              productId: { type: SchemaType.STRING },
              productName: { type: SchemaType.STRING },
              incomingQuantity: { type: SchemaType.NUMBER },
            },
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "update_product",
    description: "Update product fields (name, price, description, category, etc.). Cannot delete.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        productId: { type: SchemaType.STRING },
        updates: { type: SchemaType.OBJECT, properties: {}, description: "Fields to update" },
      },
      required: ["productId", "updates"],
    },
  },
  {
    name: "create_product",
    description: "Create a new product. Ask admin for missing required fields.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        price: { type: SchemaType.NUMBER },
        description: { type: SchemaType.STRING },
        stockQuantity: { type: SchemaType.NUMBER },
        categoryId: { type: SchemaType.STRING },
        image: { type: SchemaType.STRING },
        salePrice: { type: SchemaType.NUMBER },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "list_orders",
    description: "List recent orders, optionally filter by status.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING },
        limit: { type: SchemaType.NUMBER },
      },
    },
  },
  {
    name: "get_order",
    description: "Get order details by ID.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { orderId: { type: SchemaType.STRING } },
      required: ["orderId"],
    },
  },
  {
    name: "update_order_status",
    description: "Update order status. Never use CANCELLED.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        orderId: { type: SchemaType.STRING },
        status: { type: SchemaType.STRING, description: "PENDING|PROCESSING|SHIPPED|DELIVERED" },
      },
      required: ["orderId", "status"],
    },
  },
  {
    name: "list_categories",
    description: "List product categories.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { search: { type: SchemaType.STRING } },
    },
  },
  {
    name: "get_category",
    description: "Get full category details by ID.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { categoryId: { type: SchemaType.STRING } },
      required: ["categoryId"],
    },
  },
  {
    name: "list_attributes",
    description: "List product attributes.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "create_category",
    description: "Create a category.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        slug: { type: SchemaType.STRING },
        parentId: { type: SchemaType.STRING },
      },
      required: ["name"],
    },
  },
  {
    name: "update_category",
    description: "Update a category.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        categoryId: { type: SchemaType.STRING },
        updates: { type: SchemaType.OBJECT, properties: {} },
      },
      required: ["categoryId", "updates"],
    },
  },
  {
    name: "list_reviews",
    description: "List product reviews.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { status: { type: SchemaType.STRING, description: "PENDING|APPROVED|REJECTED" } },
    },
  },
  {
    name: "update_review_status",
    description: "Approve or reject a product review.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        reviewId: { type: SchemaType.STRING },
        status: { type: SchemaType.STRING },
      },
      required: ["reviewId", "status"],
    },
  },
  {
    name: "list_coupons",
    description: "List discount coupons.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_rewards",
    description: "List affiliate rewards.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_certifications",
    description: "List certifications.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_salons",
    description: "List salon locations.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_gallery_items",
    description: "List gallery items.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_pages",
    description: "List CMS pages.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "create_coupon",
    description: "Create a coupon. Ask admin for code, type, value if not provided.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        code: { type: SchemaType.STRING },
        discountType: { type: SchemaType.STRING, description: "PERCENTAGE or FIXED" },
        discountValue: { type: SchemaType.NUMBER },
        description: { type: SchemaType.STRING },
        minPurchaseAmount: { type: SchemaType.NUMBER },
        validUntil: { type: SchemaType.STRING },
      },
      required: ["code", "discountValue"],
    },
  },
  {
    name: "get_blog",
    description: "Get full blog post by ID including HTML content, excerpt, and slug.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { blogId: { type: SchemaType.STRING } },
      required: ["blogId"],
    },
  },
  {
    name: "fetch_web_page",
    description:
      "Fetch and extract readable text from a public URL for research, translation, or adapting content into a blog draft.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: { type: SchemaType.STRING, description: "Full https:// URL to read" },
      },
      required: ["url"],
    },
  },
  {
    name: "list_blogs",
    description: "List blog posts.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { status: { type: SchemaType.STRING } },
    },
  },
  {
    name: "create_blog_draft",
    description:
      "Create an SEO-structured blog post as DRAFT. Content must be HTML with h2/h3 sections and p paragraphs (or markdown — auto-converted). Never publish.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "SEO title, primary keyword, ~60 chars" },
        slug: { type: SchemaType.STRING, description: "URL slug, lowercase hyphenated" },
        excerpt: { type: SchemaType.STRING, description: "Meta description, 120-160 chars" },
        content: {
          type: SchemaType.STRING,
          description:
            "Full article body as HTML: h2/h3 headings, p paragraphs, ul/ol lists, internal links. Not a wall of plain text.",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "update_blog_draft",
    description: "Update a blog draft. Content should be HTML with proper headings and paragraphs. Always keeps DRAFT status.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        blogId: { type: SchemaType.STRING },
        updates: { type: SchemaType.OBJECT, properties: {} },
      },
      required: ["blogId", "updates"],
    },
  },
  {
    name: "get_analytics_summary",
    description: "Get last 30 days orders and revenue summary.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_notifications",
    description: "List recent notifications.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "create_notification",
    description: "Create a notification for an admin user.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        message: { type: SchemaType.STRING },
        userId: { type: SchemaType.STRING },
      },
      required: ["title", "message"],
    },
  },
  {
    name: "list_customers",
    description: "List customers.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { search: { type: SchemaType.STRING } },
    },
  },
  {
    name: "list_shipping_zones",
    description: "List shipping zones.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_undoable_actions",
    description: "List AI actions that can still be undone (within 1 hour).",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_training_programs",
    description: "List training programs.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_training_bookings",
    description: "List training bookings.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_affiliates",
    description: "List affiliates.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: "list_chat_messages",
    description: "List recent customer chat messages.",
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
];
