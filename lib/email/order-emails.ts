import { sendEmail } from "@/lib/email/send";
import { emailButton, emailGreeting, emailLayout, escapeHtml } from "@/lib/email/layout";
import { SITE_URL } from "@/lib/email/config";
import { formatPrice } from "@/lib/utils";

export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number | string;
  image?: string | null;
};

export type OrderEmailTrainingItem = {
  title: string;
  price: number | string;
  quantity?: number;
  image?: string | null;
};

export type OrderEmailOrder = {
  id: string;
  total: number | string;
  shippingAmount?: number | string | null;
  taxAmount?: number | string | null;
  taxRate?: number | string | null;
  shopPaymentMethod?: string | null;
  shippingAddress?: string | null;
};

export function paymentMethodLabel(method?: string | null): string {
  switch (method) {
    case "STRIPE_CARD":
      return "Cartão";
    case "STRIPE_KLARNA":
      return "Klarna";
    case "MBWAY":
      return "MB Way";
    case "BANK_TRANSFER":
      return "Transferência bancária";
    default:
      return method || "—";
  }
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toAbsoluteEmailImageUrl(url?: string | null): string | null {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${SITE_URL}${path}`;
}

/** Prefer a public file URL; fall back to the product image API for inline/data URLs. */
export function resolveOrderEmailImage(opts: {
  image?: string | null;
  images?: string[] | null;
  productId?: string;
}): string | null {
  const first = opts.image || opts.images?.[0] || null;
  if (first && !first.startsWith("data:") && !first.startsWith("blob:")) {
    return first;
  }
  if (opts.productId && first) {
    return `/api/products/${encodeURIComponent(opts.productId)}/image?index=0`;
  }
  return first;
}

function emailItemThumb(src: string | null | undefined, alt: string): string {
  const absolute = toAbsoluteEmailImageUrl(src);
  if (!absolute) return "";
  return `<td style="width:56px;padding:0 12px 0 0;vertical-align:middle;">
            <img src="${escapeHtml(absolute)}" alt="${escapeHtml(alt)}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:contain;border:1px solid #eee;background:#fafafa;" />
          </td>`;
}

function emailItemNameCell(nameHtml: string, image: string | null | undefined, alt: string): string {
  const thumb = emailItemThumb(image, alt);
  return `<td style="padding:10px 8px 10px 0;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            ${thumb}
            <td style="vertical-align:middle;font-size:14px;line-height:1.4;color:#1a1a1a;">${nameHtml}</td>
          </tr>
        </table>
      </td>`;
}

function orderSummaryTables(opts: {
  order: OrderEmailOrder;
  items: OrderEmailItem[];
  trainingItems: OrderEmailTrainingItem[];
}): { rows: string; totals: string; orderIdShort: string } {
  const orderIdShort = opts.order.id.slice(0, 8).toUpperCase();
  const items = opts.items || [];
  const trainingItems = opts.trainingItems || [];

  const productSubtotal = items.reduce((s, i) => s + num(i.price) * i.quantity, 0);
  const trainingSubtotal = trainingItems.reduce(
    (s, i) => s + num(i.price) * (i.quantity || 1),
    0
  );
  const subtotal = productSubtotal + trainingSubtotal;
  let shipping = num(opts.order.shippingAmount);
  const total = num(opts.order.total);
  if (shipping <= 0 && total > subtotal + 0.009) {
    shipping = roundMoney(total - subtotal);
  }
  const taxRate = num(opts.order.taxRate) || 23;

  const rows = [
    ...items.map((item) => `
      <tr>
        ${emailItemNameCell(escapeHtml(item.name), item.image, item.name)}
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;vertical-align:middle;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:middle;">${formatPrice(num(item.price) * item.quantity)}</td>
      </tr>`),
    ...trainingItems.map((item) => `
      <tr>
        ${emailItemNameCell(
          `${escapeHtml(item.title)} <span style="color:#888;font-size:12px;">(Formação)</span>`,
          item.image,
          item.title
        )}
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;vertical-align:middle;">${item.quantity || 1}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:middle;">${formatPrice(num(item.price) * (item.quantity || 1))}</td>
      </tr>`),
  ].join("");

  const totals = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px;">
      <tr>
        <td style="padding:4px 0;color:#666;">Subtotal</td>
        <td style="padding:4px 0;text-align:right;">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666;">Envio</td>
        <td style="padding:4px 0;text-align:right;">${shipping <= 0 ? "Grátis" : formatPrice(shipping)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;color:#666;">IVA ${taxRate}% incluído</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-weight:700;border-top:1px solid #eee;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:700;border-top:1px solid #eee;">${formatPrice(total)}</td>
      </tr>
    </table>`;

  return { rows, totals, orderIdShort };
}

/**
 * Paid order confirmation — attaches PDF invoice when provided.
 */
export async function sendOrderConfirmationEmail(opts: {
  to: string;
  name?: string | null;
  order: OrderEmailOrder;
  items: OrderEmailItem[];
  trainingItems?: OrderEmailTrainingItem[];
  invoicePdf?: { filename: string; content: Buffer } | null;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const { rows, totals, orderIdShort } = orderSummaryTables({
    order: opts.order,
    items: opts.items,
    trainingItems: opts.trainingItems || [],
  });

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">Obrigado pela sua encomenda. Segue o resumo da fatura${
      opts.invoicePdf ? " (PDF em anexo)" : ""
    }:</p>
    <p style="margin:0 0 4px;font-size:13px;color:#666;">Encomenda <strong style="color:#1a1a1a;">#${escapeHtml(orderIdShort)}</strong></p>
    <p style="margin:0 0 16px;font-size:13px;color:#666;">Pagamento: ${escapeHtml(paymentMethodLabel(opts.order.shopPaymentMethod))}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr>
        <th align="left" style="padding:0 0 8px;border-bottom:2px solid #1a1a1a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Artigo</th>
        <th align="center" style="padding:0 0 8px;border-bottom:2px solid #1a1a1a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Qtd</th>
        <th align="right" style="padding:0 0 8px;border-bottom:2px solid #1a1a1a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Preço</th>
      </tr>
      ${rows || `<tr><td colspan="3" style="padding:12px 0;color:#888;">Sem itens</td></tr>`}
    </table>
    ${totals}
    ${
      opts.order.shippingAddress
        ? `<p style="margin:20px 0 0;font-size:13px;color:#666;"><strong style="color:#333;">Morada de envio</strong><br/>${escapeHtml(opts.order.shippingAddress).replace(/\n/g, "<br/>")}</p>`
        : ""
    }
    ${emailButton(`${SITE_URL}/dashboard/orders/${opts.order.id}`, "Ver encomenda")}
  `;

  const subject = `Confirmação de encomenda #${orderIdShort} — Bio Sculpture`;

  return sendEmail({
    to: opts.to,
    subject,
    html: emailLayout({
      title: subject,
      preheader: `Fatura da encomenda #${orderIdShort}`,
      bodyHtml,
    }),
    attachments: opts.invoicePdf
      ? [
          {
            filename: opts.invoicePdf.filename,
            content: opts.invoicePdf.content,
            contentType: "application/pdf",
          },
        ]
      : undefined,
  });
}

/**
 * MB Way / bank transfer — order received, awaiting payment.
 * Does not mark the paid confirmation as sent.
 */
export async function sendAwaitingPaymentEmail(opts: {
  to: string;
  name?: string | null;
  order: OrderEmailOrder;
  items: OrderEmailItem[];
  trainingItems?: OrderEmailTrainingItem[];
  /** Trusted HTML from resolveOfflinePaymentCopy */
  paymentInstructionsHtml?: string | null;
  /** Optional proforma PDF */
  proformaPdf?: { filename: string; content: Buffer } | null;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const { rows, totals, orderIdShort } = orderSummaryTables({
    order: opts.order,
    items: opts.items,
    trainingItems: opts.trainingItems || [],
  });

  const paymentInstructionsBlock = opts.paymentInstructionsHtml
    ? `<div style="margin:0 0 20px;">
          ${opts.paymentInstructionsHtml}
          <p style="margin:14px 0 0;font-size:13px;color:#8a8680;">No descritivo do pagamento, indique <strong style="color:#1a1a1a;">#${escapeHtml(orderIdShort)}</strong>.</p>
        </div>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 16px;">
      Recebemos a sua encomenda <strong>#${escapeHtml(orderIdShort)}</strong>. Assim que confirmarmos o pagamento (${escapeHtml(
        paymentMethodLabel(opts.order.shopPaymentMethod)
      )}), avançamos com o processamento${opts.proformaPdf ? ". Segue em anexo o resumo da encomenda (proforma)." : "."}
    </p>
    ${paymentInstructionsBlock}
    <p style="margin:0 0 4px;font-size:13px;color:#666;">Encomenda <strong style="color:#1a1a1a;">#${escapeHtml(orderIdShort)}</strong></p>
    <p style="margin:0 0 16px;font-size:13px;color:#666;">Pagamento: ${escapeHtml(paymentMethodLabel(opts.order.shopPaymentMethod))} — aguarda confirmação</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr>
        <th align="left" style="padding:0 0 8px;border-bottom:2px solid #1a1a1a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Artigo</th>
        <th align="center" style="padding:0 0 8px;border-bottom:2px solid #1a1a1a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Qtd</th>
        <th align="right" style="padding:0 0 8px;border-bottom:2px solid #1a1a1a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Preço</th>
      </tr>
      ${rows || `<tr><td colspan="3" style="padding:12px 0;color:#888;">Sem itens</td></tr>`}
    </table>
    ${totals}
    ${
      opts.order.shippingAddress
        ? `<p style="margin:20px 0 0;font-size:13px;color:#666;"><strong style="color:#333;">Morada de envio</strong><br/>${escapeHtml(opts.order.shippingAddress).replace(/\n/g, "<br/>")}</p>`
        : ""
    }
    ${emailButton(`${SITE_URL}/dashboard/orders/${opts.order.id}`, "Ver encomenda")}
  `;

  const subject = `Encomenda recebida #${orderIdShort} — aguarda pagamento`;

  return sendEmail({
    to: opts.to,
    subject,
    html: emailLayout({
      title: subject,
      preheader: `Encomenda #${orderIdShort} — instruções de pagamento`,
      bodyHtml,
    }),
    attachments: opts.proformaPdf
      ? [
          {
            filename: opts.proformaPdf.filename,
            content: opts.proformaPdf.content,
            contentType: "application/pdf",
          },
        ]
      : undefined,
  });
}

export async function sendOrderReviewRequestEmail(opts: {
  to: string;
  name?: string | null;
  orderId: string;
  productLinks: Array<{ name: string; url: string }>;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const orderIdShort = opts.orderId.slice(0, 8).toUpperCase();
  const links = opts.productLinks
    .map(
      (p) =>
        `<li style="margin:0 0 8px;"><a href="${p.url}" style="color:#1a1a1a;">${escapeHtml(p.name)}</a></li>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">Esperamos que esteja a gostar da sua encomenda Bio Sculpture <strong>#${escapeHtml(orderIdShort)}</strong>. Adoraríamos o seu feedback:</p>
    <ul style="margin:0 0 16px;padding-left:18px;">${links || "<li>Visite a sua conta para deixar uma avaliação</li>"}</ul>
    ${emailButton(`${SITE_URL}/dashboard/orders/${opts.orderId}`, "Deixar avaliação")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `Como correu a encomenda #${orderIdShort}? — Bio Sculpture`,
    html: emailLayout({
      title: "Avalie a sua encomenda",
      preheader: "Partilhe a sua experiência com a Bio Sculpture",
      bodyHtml,
    }),
  });
}
