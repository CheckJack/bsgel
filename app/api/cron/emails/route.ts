import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { ManualPaymentReviewStatus, ShopPaymentMethod } from "@prisma/client";
import {
  ABANDONMENT_DAYS,
  ABANDONMENT_RESEND_DAYS,
  CRON_SECRET,
  OFFLINE_PAYMENT_EXPIRY_DAYS,
  REVIEW_DELAY_DAYS,
  SITE_URL,
} from "@/lib/email/config";
import { sendOrderReviewRequestEmail } from "@/lib/email/order-emails";
import { sendTrainingReviewRequestEmail } from "@/lib/email/training-emails";
import { sendCartAbandonmentEmail } from "@/lib/email/cart-emails";
import { releaseOrderReservations } from "@/lib/order-reservations";

function authorizeCron(req: Request): boolean {
  if (!CRON_SECRET) return false;

  const expected = CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  const bearer =
    auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const headerSecret = (req.headers.get("x-cron-secret") || "").trim();
  const provided = bearer || headerSecret;
  if (!provided || provided.length !== expected.length) return false;

  // Constant-time compare; avoid accepting ?secret= (leaks in access/proxy logs)
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function expireUnpaidOfflineOrders(now: Date) {
  const expiryCutoff = new Date(
    now.getTime() - OFFLINE_PAYMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const expired = await db.order.findMany({
    where: {
      status: "PENDING",
      manualPaymentStatus: ManualPaymentReviewStatus.PENDING,
      shopPaymentMethod: {
        in: [ShopPaymentMethod.MBWAY, ShopPaymentMethod.BANK_TRANSFER],
      },
      createdAt: { lte: expiryCutoff },
    },
    select: { id: true, userId: true, status: true },
    take: 100,
  });

  let cancelled = 0;
  for (const order of expired) {
    try {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          manualPaymentStatus: ManualPaymentReviewStatus.CANCELLED,
        },
      });
      await releaseOrderReservations(order.id, { previousStatus: order.status });
      try {
        await db.notification.create({
          data: {
            type: "ORDER_STATUS",
            title: "Pedido expirado",
            message: `O seu pedido #${order.id.slice(0, 8)} expirou porque o pagamento não foi confirmado a tempo.`,
            userId: order.userId,
            metadata: { orderId: order.id, orderStatus: "CANCELLED", reason: "offline_payment_expired" },
          },
        });
      } catch {
        /* ignore notify errors */
      }
      cancelled++;
    } catch (err) {
      console.error("[cron] expire offline order failed:", order.id, err);
    }
  }

  return { candidates: expired.length, cancelled };
}

async function runEmailCronJobs() {
  const now = new Date();
  const reviewCutoff = new Date(now.getTime() - REVIEW_DELAY_DAYS * 24 * 60 * 60 * 1000);
  const abandonCutoff = new Date(now.getTime() - ABANDONMENT_DAYS * 24 * 60 * 60 * 1000);
  const abandonResendCutoff = new Date(
    now.getTime() - ABANDONMENT_RESEND_DAYS * 24 * 60 * 60 * 1000
  );

  const results = {
    offlinePaymentExpiry: await expireUnpaidOfflineOrders(now),
    productReviews: { candidates: 0, sent: 0 },
    trainingReviews: { candidates: 0, sent: 0 },
    cartAbandonment: { candidates: 0, sent: 0 },
  };

  // a) Product review requests — DELIVERED ~4 days ago
  const deliveredOrders = await db.order.findMany({
    where: {
      status: "DELIVERED",
      reviewRequestEmailSentAt: null,
      updatedAt: { lte: reviewCutoff },
    },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
    },
    take: 50,
  });
  results.productReviews.candidates = deliveredOrders.length;

  for (const order of deliveredOrders) {
    if (!order.user.email) continue;
    try {
      const productLinks = order.items.map((item) => ({
        name: item.product.name,
        url: `${SITE_URL}/products/${item.product.id}`,
      }));
      const sent = await sendOrderReviewRequestEmail({
        to: order.user.email,
        name: order.user.name,
        orderId: order.id,
        productLinks,
      });
      if (sent) {
        await db.order.update({
          where: { id: order.id },
          data: { reviewRequestEmailSentAt: new Date() },
        });
        results.productReviews.sent++;
      }
    } catch (err) {
      console.error("[cron] product review email failed:", order.id, err);
    }
  }

  // b) Training review — COMPLETED with completedAt, or session ended + CONFIRMED/COMPLETED
  const completedBookings = await db.trainingBooking.findMany({
    where: {
      reviewRequestEmailSentAt: null,
      OR: [
        {
          status: "COMPLETED",
          completedAt: { lte: reviewCutoff },
        },
        {
          status: { in: ["CONFIRMED", "COMPLETED"] },
          session: { endDate: { lte: reviewCutoff } },
        },
      ],
    },
    include: {
      user: { select: { email: true, name: true } },
      program: { select: { title: true } },
      session: { select: { endDate: true } },
    },
    take: 50,
  });
  results.trainingReviews.candidates = completedBookings.length;

  for (const booking of completedBookings) {
    if (!booking.user.email) continue;
    try {
      const sent = await sendTrainingReviewRequestEmail({
        to: booking.user.email,
        name: booking.user.name,
        programTitle: booking.program.title,
        reviewUrl: `${SITE_URL}/dashboard/orders`,
      });
      if (sent) {
        await db.trainingBooking.update({
          where: { id: booking.id },
          data: { reviewRequestEmailSentAt: new Date() },
        });
        results.trainingReviews.sent++;
      }
    } catch (err) {
      console.error("[cron] training review email failed:", booking.id, err);
    }
  }

  // c) Cart abandonment — idle 5+ days, with items
  const carts = await db.cart.findMany({
    where: {
      updatedAt: { lte: abandonCutoff },
      OR: [
        { lastAbandonmentEmailAt: null },
        { lastAbandonmentEmailAt: { lte: abandonResendCutoff } },
      ],
      AND: [
        {
          OR: [
            { items: { some: {} } },
            { trainingItems: { some: {} } },
          ],
        },
      ],
    },
    include: {
      user: { select: { email: true, name: true } },
      items: {
        include: { product: { select: { name: true, price: true } } },
        take: 10,
      },
      trainingItems: {
        include: { session: { include: { program: { select: { title: true, price: true } } } } },
        take: 5,
      },
    },
    take: 50,
  });
  results.cartAbandonment.candidates = carts.length;

  for (const cart of carts) {
    if (!cart.user.email) continue;
    const items = [
      ...cart.items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: Number(i.product.price),
      })),
      ...cart.trainingItems.map((i) => ({
        name: i.session.program.title,
        quantity: 1,
        price: Number(i.session.program.price),
      })),
    ];
    if (items.length === 0) continue;

    try {
      const sent = await sendCartAbandonmentEmail({
        to: cart.user.email,
        name: cart.user.name,
        items,
      });
      if (sent) {
        await db.cart.update({
          where: { id: cart.id },
          data: { lastAbandonmentEmailAt: new Date() },
        });
        results.cartAbandonment.sent++;
      }
    } catch (err) {
      console.error("[cron] cart abandonment email failed:", cart.id, err);
    }
  }

  return results;
}

export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const results = await runEmailCronJobs();
    return NextResponse.json({ success: true, results, ranAt: new Date().toISOString() });
  } catch (error) {
    console.error("[cron/emails] failed:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
