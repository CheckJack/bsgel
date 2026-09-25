import { db } from "@/lib/db";
import { listUndoableActions } from "@/lib/admin-ai/undo";
import { fetchWebPageText } from "@/lib/admin-ai/fetch-url";
import type { AdminAiToolContext, AdminAiToolResult } from "@/lib/admin-ai/tools/types";

export async function getDashboardStats(): Promise<AdminAiToolResult> {
  const [totalProducts, totalOrders, revenue, pendingOrders, lowStock] = await Promise.all([
    db.product.count(),
    db.order.count(),
    db.order.aggregate({ _sum: { total: true } }),
    db.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    db.product.count({ where: { stockQuantity: { gte: 1, lte: 2 } } }),
  ]);

  return {
    success: true,
    data: {
      totalProducts,
      totalOrders,
      totalRevenue: Number(revenue._sum.total || 0),
      pendingOrders,
      urgentStockCount: lowStock,
    },
  };
}

export async function searchAdminLogs(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const limit = Math.min(50, Number(args.limit) || 20);
  const search = String(args.search || "").trim();
  const resourceType = args.resourceType ? String(args.resourceType) : undefined;

  const logs = await db.adminLog.findMany({
    where: {
      ...(resourceType ? { resourceType } : {}),
      ...(search ? { description: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  return { success: true, data: logs };
}

export async function listProducts(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const search = String(args.search || "").trim();
  const limit = Math.min(50, Number(args.limit) || 20);
  const page = Math.max(1, Number(args.page) || 1);

  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        stockQuantity: true,
        outOfStock: true,
        category: { select: { name: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return { success: true, data: { products, total, page, limit } };
}

export async function getProduct(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const id = String(args.productId || args.id || "");
  if (!id) return { success: false, error: "productId is required" };

  const product = await db.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) return { success: false, error: "Product not found" };
  return { success: true, data: product };
}

export async function searchProducts(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  return listProducts(args);
}

export async function listStock(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const urgent = args.urgent === true || args.urgent === "true";
  const search = String(args.search || "").trim();
  const limit = Math.min(200, Number(args.limit) || 50);

  const where: Record<string, unknown> = {};
  if (urgent) where.stockQuantity = { gte: 1, lte: 2 };
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      take: limit,
      orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        outOfStock: true,
        category: { select: { name: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return { success: true, data: { products, total, limit, truncated: total > products.length } };
}

export async function listOrders(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const status = args.status ? String(args.status).toUpperCase() : undefined;
  const limit = Math.min(50, Number(args.limit) || 20);

  const orders = await db.order.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  return { success: true, data: orders };
}

export async function getOrder(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const id = String(args.orderId || args.id || "");
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!order) return { success: false, error: "Order not found" };
  return { success: true, data: order };
}

export async function listCategories(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const search = String(args.search || "").trim();
  const categories = await db.category.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    take: 100,
    select: { id: true, name: true, slug: true, parentId: true },
  });
  return { success: true, data: categories };
}

export async function getCategory(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const categoryId = String(args.categoryId || "").trim();
  if (!categoryId) return { success: false, error: "categoryId is required" };
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      parent: { select: { id: true, name: true } },
      subcategories: { select: { id: true, name: true, slug: true }, take: 20 },
      _count: { select: { products: true } },
    },
  });
  if (!category) return { success: false, error: "Category not found" };
  return { success: true, data: category };
}

export async function listAttributes(): Promise<AdminAiToolResult> {
  const attributes = await db.attribute.findMany({
    orderBy: { category: "asc" },
    take: 100,
  });
  return { success: true, data: attributes };
}

export async function listReviews(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const status = args.status ? String(args.status).toUpperCase() : "PENDING";
  const reviews = await db.productReview.findMany({
    where: { status: status as never },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      product: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });
  return { success: true, data: reviews };
}

export async function listCoupons(): Promise<AdminAiToolResult> {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { success: true, data: coupons };
}

export async function listBlogs(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const status = args.status ? String(args.status).toUpperCase() : undefined;
  const blogs = await db.blog.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
  });
  return { success: true, data: blogs };
}

export async function getBlog(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const id = String(args.blogId || args.id || "");
  if (!id) return { success: false, error: "blogId is required" };

  const blog = await db.blog.findUnique({ where: { id } });
  if (!blog) return { success: false, error: "Blog not found." };

  return { success: true, data: blog };
}

export async function fetchWebPage(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const url = String(args.url || "").trim();
  if (!url) return { success: false, error: "url is required" };

  try {
    const result = await fetchWebPageText(url);
    return {
      success: true,
      data: {
        url: result.url,
        title: result.title,
        text: result.text,
        truncated: result.truncated,
        charCount: result.text.length,
      },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to fetch URL" };
  }
}

export async function getAnalyticsSummary(): Promise<AdminAiToolResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recentOrders, revenue] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { total: true },
    }),
  ]);
  return {
    success: true,
    data: {
      last30DaysOrders: recentOrders,
      last30DaysRevenue: Number(revenue._sum.total || 0),
    },
  };
}

export async function listNotifications(): Promise<AdminAiToolResult> {
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, title: true, type: true, createdAt: true, read: true },
  });
  return { success: true, data: notifications };
}

export async function listCustomers(args: Record<string, unknown>): Promise<AdminAiToolResult> {
  const search = String(args.search || "").trim();
  const users = await db.user.findMany({
    where: {
      role: "USER",
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    take: 30,
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return { success: true, data: users };
}

export async function listShippingZones(): Promise<AdminAiToolResult> {
  const zones = await db.shippingZone.findMany({ orderBy: { name: "asc" } });
  return { success: true, data: zones };
}

export async function listChatMessages(): Promise<AdminAiToolResult> {
  const messages = await db.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true, email: true } } },
  });
  return { success: true, data: messages };
}

export async function listTrainingPrograms(): Promise<AdminAiToolResult> {
  const programs = await db.trainingProgram.findMany({
    orderBy: { displayOrder: "asc" },
    take: 50,
    select: { id: true, title: true, price: true, isActive: true },
  });
  return { success: true, data: programs };
}

export async function listTrainingBookings(): Promise<AdminAiToolResult> {
  const bookings = await db.trainingBooking.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { name: true, email: true } },
      session: { select: { startDate: true, location: true } },
    },
  });
  return { success: true, data: bookings };
}

export async function listAffiliates(): Promise<AdminAiToolResult> {
  const affiliates = await db.affiliate.findMany({
    take: 30,
    include: { user: { select: { name: true, email: true } } },
  });
  return { success: true, data: affiliates };
}

export async function listRewards(): Promise<AdminAiToolResult> {
  const rewards = await db.reward.findMany({ take: 30 });
  return { success: true, data: rewards };
}

export async function listCertifications(): Promise<AdminAiToolResult> {
  const certs = await db.certification.findMany({ take: 50 });
  return { success: true, data: certs };
}

export async function listSalons(): Promise<AdminAiToolResult> {
  const salons = await db.salon.findMany({ take: 30 });
  return { success: true, data: salons };
}

export async function listGalleryItems(): Promise<AdminAiToolResult> {
  const items = await db.galleryItem.findMany({ take: 30 });
  return { success: true, data: items };
}

export async function listPages(): Promise<AdminAiToolResult> {
  const pages = await db.page.findMany({
    take: 30,
    select: { id: true, name: true, slug: true, status: true },
  });
  return { success: true, data: pages };
}

export async function listUndoableActionsTool(
  _args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const entries = await listUndoableActions(ctx.userId, ctx.conversationId);
  return { success: true, data: entries };
}

export const READ_TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>, ctx?: AdminAiToolContext) => Promise<AdminAiToolResult>
> = {
  get_dashboard_stats: () => getDashboardStats(),
  search_admin_logs: searchAdminLogs,
  list_products: listProducts,
  get_product: getProduct,
  search_products: searchProducts,
  list_stock: listStock,
  list_orders: listOrders,
  get_order: getOrder,
  list_categories: listCategories,
  get_category: getCategory,
  list_attributes: () => listAttributes(),
  list_reviews: listReviews,
  list_coupons: () => listCoupons(),
  list_blogs: listBlogs,
  get_blog: getBlog,
  fetch_web_page: fetchWebPage,
  get_analytics_summary: () => getAnalyticsSummary(),
  list_notifications: () => listNotifications(),
  list_customers: listCustomers,
  list_shipping_zones: () => listShippingZones(),
  list_chat_messages: () => listChatMessages(),
  list_training_programs: () => listTrainingPrograms(),
  list_training_bookings: () => listTrainingBookings(),
  list_affiliates: () => listAffiliates(),
  list_rewards: () => listRewards(),
  list_certifications: () => listCertifications(),
  list_salons: () => listSalons(),
  list_gallery_items: () => listGalleryItems(),
  list_pages: () => listPages(),
  list_undoable_actions: (args, ctx) =>
    listUndoableActionsTool(args, ctx!),
};
