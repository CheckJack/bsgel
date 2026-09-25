export type QuickAction = {
  id: string;
  promptEn: string;
  promptPt: string;
  labelKey: string;
};

const GLOBAL: QuickAction[] = [
  { id: "dashboard", labelKey: "dashboardStats", promptEn: "Show dashboard stats summary", promptPt: "Mostra um resumo das estatísticas do painel" },
  { id: "urgent-stock", labelKey: "urgentStock", promptEn: "List all urgent low stock products (qty 1-2)", promptPt: "Lista todos os produtos com stock urgente (qty 1-2)" },
  { id: "pending-orders", labelKey: "pendingOrders", promptEn: "List pending and processing orders", promptPt: "Lista encomendas pendentes e em processamento" },
];

const BY_PREFIX: { prefix: string; actions: QuickAction[] }[] = [
  {
    prefix: "/admin/stock",
    actions: [
      { id: "stock-urgent", labelKey: "urgentStock", promptEn: "Show urgent stock on this page", promptPt: "Mostra stock urgente" },
      { id: "stock-out", labelKey: "outOfStock", promptEn: "List out of stock products", promptPt: "Lista produtos sem stock" },
      { id: "pdf-import", labelKey: "importPdf", promptEn: "I will upload a supplier PDF — prepare to match products and add incoming stock", promptPt: "Vou carregar um PDF de fornecedor — prepara para corresponder produtos e adicionar stock" },
    ],
  },
  {
    prefix: "/admin/products",
    actions: [
      { id: "products-recent", labelKey: "recentProducts", promptEn: "List the 20 most recent products", promptPt: "Lista os 20 produtos mais recentes" },
      { id: "products-create", labelKey: "createProduct", promptEn: "I want to create a new product — ask me for the required details", promptPt: "Quero criar um novo produto — pergunta-me os detalhes necessários" },
    ],
  },
  {
    prefix: "/admin/orders",
    actions: [
      { id: "orders-pending", labelKey: "pendingOrders", promptEn: "List orders awaiting action", promptPt: "Lista encomendas que precisam de ação" },
    ],
  },
  {
    prefix: "/admin/blogs",
    actions: [
      { id: "blog-drafts", labelKey: "blogDrafts", promptEn: "List blog drafts", promptPt: "Lista rascunhos do blog" },
      { id: "blog-create", labelKey: "createBlog", promptEn: "Help me create a new blog draft", promptPt: "Ajuda-me a criar um novo rascunho de blog" },
    ],
  },
  {
    prefix: "/admin/coupons",
    actions: [
      { id: "coupons-list", labelKey: "listCoupons", promptEn: "List active coupons", promptPt: "Lista cupões ativos" },
      { id: "coupon-create", labelKey: "createCoupon", promptEn: "Help me create a new coupon", promptPt: "Ajuda-me a criar um novo cupão" },
    ],
  },
  {
    prefix: "/admin/reviews",
    actions: [
      { id: "reviews-pending", labelKey: "pendingReviews", promptEn: "List pending product reviews", promptPt: "Lista avaliações de produtos pendentes" },
    ],
  },
  {
    prefix: "/admin/logs",
    actions: [
      { id: "logs-recent", labelKey: "recentLogs", promptEn: "Show the 20 most recent admin activity logs", promptPt: "Mostra os 20 registos de atividade mais recentes" },
    ],
  },
];

export function getQuickActionsForPage(pathname: string): QuickAction[] {
  const pageActions = BY_PREFIX.find((p) => pathname.startsWith(p.prefix))?.actions ?? [];
  const merged = [...pageActions, ...GLOBAL];
  const seen = new Set<string>();
  return merged.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  }).slice(0, 6);
}

export function getQuickActionPrompt(action: QuickAction, language: string): string {
  return language === "pt" ? action.promptPt : action.promptEn;
}
