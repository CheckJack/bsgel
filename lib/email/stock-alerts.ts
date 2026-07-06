import { sendEmail } from "@/lib/email/send";

const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

export async function sendCustomerBackInStockEmail(opts: {
  to: string;
  customerName: string | null;
  productName: string;
  productId: string;
}) {
  const productUrl = `${siteUrl}/products/${opts.productId}`;
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : "Hi,";

  await sendEmail({
    to: opts.to,
    subject: `${opts.productName} is back in stock`,
    html: `
      <p>${greeting}</p>
      <p>Good news — <strong>${opts.productName}</strong> is available again.</p>
      <p><a href="${productUrl}">View product</a></p>
    `,
  });
}

export async function sendAdminLowStockEmail(opts: {
  to: string;
  adminName: string | null;
  productName: string;
  stockQuantity: number;
  productId: string;
}) {
  const stockUrl = `${siteUrl}/admin/stock?urgent=true`;
  const greeting = opts.adminName ? `Hi ${opts.adminName},` : "Hi,";

  await sendEmail({
    to: opts.to,
    subject: `Low stock: ${opts.productName}`,
    html: `
      <p>${greeting}</p>
      <p><strong>${opts.productName}</strong> has only ${opts.stockQuantity} unit${opts.stockQuantity === 1 ? "" : "s"} left.</p>
      <p><a href="${stockUrl}">Manage stock</a></p>
    `,
  });
}
