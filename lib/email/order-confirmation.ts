import { db } from "@/lib/db";
import { ShopPaymentMethod, ManualPaymentReviewStatus } from "@prisma/client";
import {
  sendAwaitingPaymentEmail,
  sendOrderConfirmationEmail,
  resolveOrderEmailImage,
} from "@/lib/email/order-emails";
import { sendTrainingCourseInfoEmail } from "@/lib/email/training-emails";
import { buildOrderInvoicePdf } from "@/lib/invoice/order-invoice";
import { resolveOfflinePaymentCopy } from "@/lib/checkout/resolve-offline-payment-copy";

function isImmediateOrPaid(order: {
  shopPaymentMethod: ShopPaymentMethod | null;
  manualPaymentStatus: ManualPaymentReviewStatus | null;
  status: string;
}): boolean {
  if (
    order.shopPaymentMethod === ShopPaymentMethod.STRIPE_CARD ||
    order.shopPaymentMethod === ShopPaymentMethod.STRIPE_KLARNA
  ) {
    return true;
  }
  if (order.manualPaymentStatus === ManualPaymentReviewStatus.CONFIRMED) {
    return true;
  }
  if (
    order.status === "PROCESSING" ||
    order.status === "SHIPPED" ||
    order.status === "DELIVERED"
  ) {
    return true;
  }
  return false;
}

const orderEmailInclude = {
  user: { select: { id: true, email: true, name: true } },
  items: { include: { product: { select: { id: true, name: true, image: true, images: true } } } },
  trainingItems: {
    include: {
      program: { select: { id: true, title: true, description: true, image: true } },
      session: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          location: true,
          format: true,
        },
      },
      booking: true,
    },
  },
} as const;

/**
 * Send order confirmation (invoice PDF) when payment is confirmed.
 * For MBWay / bank transfer, waits until admin confirms (or status moves past PENDING).
 * Also sends training course info emails for confirmed bookings.
 */
export async function maybeSendOrderConfirmation(orderId: string): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: orderEmailInclude,
  });

  if (!order) {
    return { sent: false, reason: "order_not_found" };
  }

  if (order.confirmationEmailSentAt) {
    return { sent: false, reason: "already_sent" };
  }

  if (!isImmediateOrPaid(order)) {
    return { sent: false, reason: "payment_pending" };
  }

  const to = order.user.email;
  if (!to) {
    return { sent: false, reason: "no_email" };
  }

  let invoicePdf: { filename: string; content: Buffer } | null = null;
  try {
    invoicePdf = await buildOrderInvoicePdf(order, "invoice");
  } catch (err) {
    console.error("[invoice] PDF generation failed:", err);
  }

  const emailed = await sendOrderConfirmationEmail({
    to,
    name: order.user.name,
    order: {
      id: order.id,
      total: Number(order.total),
      shippingAmount: order.shippingAmount != null ? Number(order.shippingAmount) : 0,
      taxAmount: order.taxAmount != null ? Number(order.taxAmount) : 0,
      taxRate: order.taxRate != null ? Number(order.taxRate) : 23,
      shopPaymentMethod: order.shopPaymentMethod,
      shippingAddress: order.shippingAddress,
    },
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
      image: resolveOrderEmailImage({
        image: item.product.image,
        images: item.product.images,
        productId: item.product.id,
      }),
    })),
    trainingItems: order.trainingItems.map((item) => ({
      title: item.program.title,
      price: Number(item.price),
      quantity: item.quantity,
      image: resolveOrderEmailImage({ image: item.program.image }),
    })),
    invoicePdf,
  });

  if (emailed) {
    await db.order.update({
      where: { id: order.id },
      data: { confirmationEmailSentAt: new Date() },
    });
  }

  for (const item of order.trainingItems) {
    if (!item.bookingId || !item.booking) continue;
    if (item.booking.courseInfoEmailSentAt) continue;

    try {
      const sent = await sendTrainingCourseInfoEmail({
        to,
        name: order.user.name,
        program: {
          title: item.program.title,
          description: item.program.description,
        },
        session: {
          startDate: item.session.startDate,
          endDate: item.session.endDate,
          location: item.session.location,
          format: item.session.format,
        },
        bookingId: item.bookingId,
      });
      if (sent) {
        await db.trainingBooking.update({
          where: { id: item.bookingId },
          data: { courseInfoEmailSentAt: new Date() },
        });
      }
    } catch (err) {
      console.error("[email] training course info failed:", err);
    }
  }

  return { sent: emailed, reason: emailed ? undefined : "send_failed" };
}

/**
 * Send “awaiting payment” email for MB Way / bank transfer orders.
 * Separate from paid confirmation so the invoice email can still go out later.
 */
export async function maybeSendAwaitingPaymentEmail(orderId: string): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: orderEmailInclude,
  });

  if (!order) {
    return { sent: false, reason: "order_not_found" };
  }

  if (order.awaitingPaymentEmailSentAt) {
    return { sent: false, reason: "already_sent" };
  }

  const isOffline =
    order.shopPaymentMethod === ShopPaymentMethod.MBWAY ||
    order.shopPaymentMethod === ShopPaymentMethod.BANK_TRANSFER;

  if (!isOffline) {
    return { sent: false, reason: "not_offline_payment" };
  }

  if (isImmediateOrPaid(order)) {
    return { sent: false, reason: "already_paid" };
  }

  const to = order.user.email;
  if (!to) {
    return { sent: false, reason: "no_email" };
  }

  let paymentInstructionsHtml: string | null = null;
  try {
    const copy = await resolveOfflinePaymentCopy();
    paymentInstructionsHtml =
      order.shopPaymentMethod === ShopPaymentMethod.MBWAY
        ? copy.mbway
        : copy.bankTransfer;
  } catch (err) {
    console.error("[email] failed to load offline payment copy:", err);
  }

  let proformaPdf: { filename: string; content: Buffer } | null = null;
  try {
    proformaPdf = await buildOrderInvoicePdf(order, "proforma");
  } catch (err) {
    console.error("[invoice] proforma PDF generation failed:", err);
  }

  const emailed = await sendAwaitingPaymentEmail({
    to,
    name: order.user.name,
    order: {
      id: order.id,
      total: Number(order.total),
      shippingAmount: order.shippingAmount != null ? Number(order.shippingAmount) : 0,
      taxAmount: order.taxAmount != null ? Number(order.taxAmount) : 0,
      taxRate: order.taxRate != null ? Number(order.taxRate) : 23,
      shopPaymentMethod: order.shopPaymentMethod,
      shippingAddress: order.shippingAddress,
    },
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
      image: resolveOrderEmailImage({
        image: item.product.image,
        images: item.product.images,
        productId: item.product.id,
      }),
    })),
    trainingItems: order.trainingItems.map((item) => ({
      title: item.program.title,
      price: Number(item.price),
      quantity: item.quantity,
      image: resolveOrderEmailImage({ image: item.program.image }),
    })),
    paymentInstructionsHtml,
    proformaPdf,
  });

  if (emailed) {
    await db.order.update({
      where: { id: order.id },
      data: { awaitingPaymentEmailSentAt: new Date() },
    });
  }

  return { sent: emailed, reason: emailed ? undefined : "send_failed" };
}
