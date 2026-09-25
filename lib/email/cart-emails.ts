import { sendEmail } from "@/lib/email/send";
import { emailButton, emailGreeting, emailLayout, escapeHtml } from "@/lib/email/layout";
import { SITE_URL } from "@/lib/email/config";
import { formatPrice } from "@/lib/utils";

export async function sendCartAbandonmentEmail(opts: {
  to: string;
  name?: string | null;
  items: Array<{ name: string; quantity?: number; price?: number | string | null }>;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const list = opts.items
    .slice(0, 8)
    .map((item) => {
      const qty = item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : "";
      const price =
        item.price != null && item.price !== ""
          ? ` — ${formatPrice(item.price)}`
          : "";
      return `<li style="margin:0 0 6px;">${escapeHtml(item.name)}${qty}${price}</li>`;
    })
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">Deixou artigos no seu cesto Bio Sculpture. Ainda estão à sua espera:</p>
    <ul style="margin:0 0 16px;padding-left:18px;">${list || "<li>Artigos no seu cesto</li>"}</ul>
    ${emailButton(`${SITE_URL}/cart`, "Voltar ao cesto")}
    <p style="margin:0;font-size:13px;color:#666;">O stock pode alterar-se — conclua a encomenda em breve para garantir estes produtos.</p>
  `;

  return sendEmail({
    to: opts.to,
    subject: "Deixou artigos no cesto — Bio Sculpture",
    html: emailLayout({
      title: "Lembrete do cesto",
      preheader: "O seu cesto ainda está à sua espera",
      bodyHtml,
    }),
  });
}
