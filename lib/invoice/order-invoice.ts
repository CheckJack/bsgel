import {
  generateInvoicePdf,
  invoiceFilename,
  type InvoiceData,
  type InvoiceLineItem,
} from "@/lib/invoice/generate-invoice-pdf";
import { paymentMethodLabel } from "@/lib/email/order-emails";

type OrderLike = {
  id: string;
  createdAt: Date;
  total: unknown;
  shippingAmount?: unknown;
  taxAmount?: unknown;
  taxRate?: unknown;
  shippingAddress?: string | null;
  billingNif?: string | null;
  billingAddress?: string | null;
  shopPaymentMethod?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
  items?: Array<{
    quantity: number;
    price: unknown;
    product?: { name?: string | null } | null;
  }>;
  trainingItems?: Array<{
    quantity?: number | null;
    price: unknown;
    program?: { title?: string | null } | null;
  }>;
};

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    try {
      return (v as { toNumber: () => number }).toNumber();
    } catch {
      return Number(v) || 0;
    }
  }
  return Number(v) || 0;
}

export function buildInvoiceData(
  order: OrderLike,
  documentType: "invoice" | "proforma" = "invoice"
): InvoiceData {
  const items: InvoiceLineItem[] = [
    ...(order.items || []).map((item) => ({
      name: item.product?.name || "Produto",
      quantity: item.quantity,
      unitPrice: toNumber(item.price),
      kind: "product" as const,
    })),
    ...(order.trainingItems || []).map((item) => ({
      name: item.program?.title || "Formação",
      quantity: item.quantity || 1,
      unitPrice: toNumber(item.price),
      kind: "training" as const,
    })),
  ];

  return {
    orderId: order.id,
    createdAt: order.createdAt,
    customerName: order.user?.name,
    customerEmail: order.user?.email,
    shippingAddress: order.shippingAddress,
    billingNif: order.billingNif,
    billingAddress: order.billingAddress,
    paymentMethodLabel: paymentMethodLabel(order.shopPaymentMethod),
    items,
    shippingAmount: toNumber(order.shippingAmount),
    taxAmount: toNumber(order.taxAmount),
    taxRate: order.taxRate != null ? toNumber(order.taxRate) : null,
    total: toNumber(order.total),
    documentType,
  };
}

export async function buildOrderInvoicePdf(
  order: OrderLike,
  documentType: "invoice" | "proforma" = "invoice"
): Promise<{ filename: string; content: Buffer }> {
  const content = await generateInvoicePdf(buildInvoiceData(order, documentType));
  return {
    filename: invoiceFilename(order.id, documentType),
    content,
  };
}
