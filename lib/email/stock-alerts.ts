import { sendEmail } from "@/lib/email/send";
import { emailButton, emailGreeting, emailLayout, escapeHtml } from "@/lib/email/layout";
import { SITE_URL } from "@/lib/email/config";

export async function sendCustomerBackInStockEmail(opts: {
  to: string;
  customerName: string | null;
  productName: string;
  productId: string;
}) {
  const productUrl = `${SITE_URL}/products/${opts.productId}`;
  const greeting = emailGreeting(opts.customerName);
  const name = escapeHtml(opts.productName);

  await sendEmail({
    to: opts.to,
    subject: `${opts.productName} está novamente em stock`,
    html: emailLayout({
      title: "Produto novamente em stock",
      preheader: `${opts.productName} está novamente disponível`,
      bodyHtml: `
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;"><strong>${name}</strong> está novamente disponível.</p>
        ${emailButton(productUrl, "Ver produto")}
      `,
    }),
  });
}

export async function sendAdminLowStockEmail(opts: {
  to: string;
  adminName: string | null;
  productName: string;
  stockQuantity: number;
  productId: string;
}) {
  const stockUrl = `${SITE_URL}/admin/stock?urgent=true`;
  const greeting = emailGreeting(opts.adminName);
  const name = escapeHtml(opts.productName);
  const units = opts.stockQuantity === 1 ? "unidade" : "unidades";

  await sendEmail({
    to: opts.to,
    subject: `Stock baixo: ${opts.productName}`,
    html: emailLayout({
      title: "Alerta de stock baixo",
      preheader: `${opts.productName} tem apenas ${opts.stockQuantity} ${units}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;"><strong>${name}</strong> tem apenas ${opts.stockQuantity} ${units}.</p>
        ${emailButton(stockUrl, "Gerir stock")}
      `,
    }),
  });
}
