/**
 * In-app notification i18n: store translation keys in metadata.i18n and
 * resolve title/message at display time so language switches update existing rows.
 */

import { Prisma } from "@prisma/client";

export type NotificationI18nMeta = {
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, string>;
};

export type NotificationLike = {
  type?: string | null;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
};

type TranslateFn = (key: string, params?: Record<string, string>) => string;

/** Merge i18n keys into notification metadata for create/update payloads. */
export function withNotificationI18n(
  metadata: Record<string, unknown> | null | undefined,
  i18n: NotificationI18nMeta
): Prisma.InputJsonValue {
  return {
    ...(metadata || {}),
    i18n,
  } as Prisma.InputJsonValue;
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function orderShortId(metadata: Record<string, unknown>): string {
  const id = asString(metadata.orderId);
  return id ? id.slice(0, 8) : "";
}

/**
 * Resolve display title/message for a notification.
 * Prefers metadata.i18n keys; otherwise infers from type + metadata for legacy rows.
 * Admin free-text SYSTEM broadcasts without keys stay as stored (often one language).
 */
export function resolveNotificationCopy(
  notification: NotificationLike,
  t: TranslateFn
): { title: string; message: string } {
  const metadata = (notification.metadata || {}) as Record<string, unknown>;
  const i18n = metadata.i18n as NotificationI18nMeta | undefined;
  const params = { ...(i18n?.params || {}) };

  if (i18n?.titleKey || i18n?.messageKey) {
    return {
      title: i18n.titleKey ? t(i18n.titleKey, params) : notification.title,
      message: i18n.messageKey ? t(i18n.messageKey, params) : notification.message,
    };
  }

  const type = asString(notification.type).toUpperCase();
  const orderId = orderShortId(metadata);
  const orderStatus = asString(metadata.orderStatus);
  const certName = asString(metadata.certificationName || metadata.certName);
  const productName = asString(metadata.productName);
  const stockQuantity = asString(metadata.stockQuantity);
  const customerName = asString(metadata.customerName || metadata.name);
  const customerEmail = asString(metadata.email);
  const total = asString(metadata.totalFormatted || metadata.total);
  const tier = asString(metadata.tier);
  const points = asString(metadata.points);
  const salonName = asString(metadata.salonName);
  const milestoneType = asString(metadata.milestoneType);

  // --- Typed system notifications ---
  if (type === "CERTIFICATION_APPROVED") {
    return {
      title: t("inApp.certificationApprovedTitle"),
      message: t("inApp.certificationApprovedMessage", {
        certName: certName || t("inApp.yourCertification"),
      }),
    };
  }

  if (asString(metadata.kind).toUpperCase() === "CERTIFICATION_REJECTED") {
    const reason = asString(metadata.reason) || notification.message;
    return {
      title: t("inApp.certificationRejectedTitle"),
      message: t("inApp.certificationRejectedMessage", {
        reason,
        certName: certName || t("inApp.yourCertification"),
      }),
    };
  }

  if (type === "STOCK_BACK_IN_STOCK") {
    return {
      title: t("inApp.backInStockTitle"),
      message: productName
        ? t("inApp.backInStockMessage", { productName })
        : notification.message,
    };
  }

  if (type === "STOCK_LOW") {
    return {
      title: t("inApp.lowStockTitle"),
      message:
        productName && stockQuantity
          ? t("inApp.lowStockMessage", { productName, stockQuantity })
          : notification.message,
    };
  }

  if (type === "ORDER_SHIPPED" || (type === "ORDER_STATUS" && orderStatus === "SHIPPED")) {
    return {
      title: t("inApp.orderShippedTitle"),
      message: t("inApp.orderShippedMessage", { orderId }),
    };
  }

  if (type === "ORDER_DELIVERED" || (type === "ORDER_STATUS" && orderStatus === "DELIVERED")) {
    return {
      title: t("inApp.orderDeliveredTitle"),
      message: t("inApp.orderDeliveredMessage", { orderId }),
    };
  }

  if (type === "ORDER_STATUS" && orderStatus === "CANCELLED") {
    return {
      title: t("inApp.orderCancelledTitle"),
      message: t("inApp.orderCancelledMessage", { orderId }),
    };
  }

  if (type === "ORDER_STATUS" && orderStatus === "PROCESSING") {
    return {
      title: t("inApp.orderConfirmedTitle"),
      message: total
        ? t("inApp.orderConfirmedMessageWithTotal", { orderId, total })
        : t("inApp.orderConfirmedMessage", { orderId }),
    };
  }

  if (type === "ORDER_STATUS") {
    const statusKey =
      orderStatus === "PENDING"
        ? "inApp.statusPending"
        : orderStatus === "PROCESSING"
          ? "inApp.statusProcessing"
          : orderStatus === "SHIPPED"
            ? "inApp.statusShipped"
            : orderStatus === "DELIVERED"
              ? "inApp.statusDelivered"
              : orderStatus === "CANCELLED"
                ? "inApp.statusCancelled"
                : "";
    const statusLabel = statusKey ? t(statusKey) : orderStatus || notification.message;
    return {
      title: t("inApp.orderStatusUpdatedTitle"),
      message: t("inApp.orderStatusUpdatedMessage", {
        orderId,
        status: statusLabel,
      }),
    };
  }

  if (type === "ORDER") {
    const isManual =
      asString(metadata.paymentMode).toLowerCase().includes("manual") ||
      /manual payment/i.test(notification.title) ||
      /pagamento manual/i.test(notification.title);
    return {
      title: isManual ? t("inApp.newOrderManualTitle") : t("inApp.newOrderTitle"),
      message: t("inApp.newOrderMessage", {
        orderId,
        customer: customerName || customerEmail || t("inApp.customer"),
        total: total || "",
      }),
    };
  }

  if (type === "SALON_APPROVED") {
    return {
      title: t("inApp.salonApprovedTitle"),
      message: t("inApp.salonApprovedMessage"),
    };
  }

  if (type === "SALON_REJECTED") {
    return {
      title: t("inApp.salonRejectedTitle"),
      message: t("inApp.salonRejectedMessage"),
    };
  }

  if (type === "NEW_CUSTOMER") {
    return {
      title: t("inApp.newCustomerTitle"),
      message: t("inApp.newCustomerMessage", {
        name: customerName || t("inApp.customer"),
        email: customerEmail,
      }),
    };
  }

  if (type === "NEW_PROFESSIONAL_CERTIFICATION") {
    const isUpdate =
      /updated/i.test(notification.title) ||
      /atualiz/i.test(notification.title) ||
      metadata.isUpdate === true;
    return {
      title: isUpdate
        ? t("inApp.updatedCertificationTitle")
        : t("inApp.newCertificationTitle"),
      message: isUpdate
        ? t("inApp.updatedCertificationMessage", {
            name: customerName || customerEmail || t("inApp.customer"),
          })
        : t("inApp.newCertificationMessage", {
            name: customerName || customerEmail || t("inApp.customer"),
          }),
    };
  }

  // --- SYSTEM subtypes via metadata / known titles ---
  if (milestoneType) {
    const keyBase = `inApp.milestone.${milestoneType}`;
    const title = t(`${keyBase}Title`);
    const message =
      milestoneType === "points_1000"
        ? t(`${keyBase}Message`, { points: points || "1000" })
        : t(`${keyBase}Message`);
    if (title !== `${keyBase}Title`) {
      return { title, message };
    }
  }

  if (tier) {
    return {
      title: t("inApp.tierUpgradeTitle", { tier }),
      message: t("inApp.tierUpgradeMessage", { tier }),
    };
  }

  const titleLower = notification.title.toLowerCase();

  if (
    (titleLower.includes("certification pending review") ||
      titleLower.includes("certificação pendente") ||
      titleLower.includes("certificação em análise")) &&
    !titleLower.includes("new professional") &&
    !titleLower.includes("nova certificação")
  ) {
    return {
      title: t("inApp.certificationPendingTitle"),
      message: t("inApp.certificationPendingMessage"),
    };
  }

  if (
    titleLower.includes("certification refused") ||
    titleLower.includes("certificação recusada")
  ) {
    const reason = asString(metadata.reason);
    return {
      title: t("inApp.certificationRejectedTitle"),
      message: reason
        ? t("inApp.certificationRejectedMessage", { reason })
        : notification.message,
    };
  }

  if (
    titleLower.includes("certification update submitted") ||
    titleLower.includes("atualização de certificação")
  ) {
    return {
      title: t("inApp.certificationUpdateSubmittedTitle"),
      message: t("inApp.certificationUpdateSubmittedMessage"),
    };
  }

  if (titleLower.includes("new chat message") || titleLower.includes("nova mensagem")) {
    return {
      title: t("inApp.newChatTitle"),
      message: t("inApp.newChatMessage", {
        name: customerName || customerEmail || t("inApp.customer"),
      }),
    };
  }

  if (titleLower.includes("salon listing updated") || titleLower.includes("listagem do salão")) {
    return {
      title: t("inApp.salonUpdatedTitle"),
      message: notification.message || t("inApp.salonUpdatedMessage"),
    };
  }

  if (titleLower.includes("salon deleted") || titleLower.includes("salão eliminado")) {
    return {
      title: t("inApp.salonDeletedTitle"),
      message: notification.message || t("inApp.salonDeletedMessage", { salonName }),
    };
  }

  if (titleLower.includes("back in stock") || titleLower.includes("de volta ao stock")) {
    return {
      title: t("inApp.backInStockTitle"),
      message: productName
        ? t("inApp.backInStockMessage", { productName })
        : notification.message,
    };
  }

  if (titleLower.includes("low stock") || titleLower.includes("stock baixo")) {
    return {
      title: t("inApp.lowStockTitle"),
      message: notification.message,
    };
  }

  // Admin-authored / unknown: keep stored copy
  return {
    title: notification.title,
    message: notification.message,
  };
}
