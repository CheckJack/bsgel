import { sendEmail } from "@/lib/email/send";
import { emailButton, emailGreeting, emailLayout, escapeHtml } from "@/lib/email/layout";
import { SITE_URL } from "@/lib/email/config";

export async function sendCertificationApprovedEmail(opts: {
  to: string;
  customerName: string | null;
  certificationName: string;
}) {
  const dashboardUrl = `${SITE_URL}/dashboard/orders`;
  const greeting = emailGreeting(opts.customerName);
  const cert = escapeHtml(opts.certificationName);

  await sendEmail({
    to: opts.to,
    subject: `Certificação aprovada — ${opts.certificationName}`,
    html: emailLayout({
      title: "Certificação aprovada",
      preheader: `A sua certificação ${opts.certificationName} foi aprovada`,
      bodyHtml: `
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;">A sua certificação <strong>${cert}</strong> foi aprovada.</p>
        <p style="margin:0 0 12px;">Já tem acesso completo às funcionalidades e produtos profissionais.</p>
        ${emailButton(dashboardUrl, "Ir para a área de cliente")}
      `,
    }),
    text: `${greeting.replace(/<[^>]+>/g, "")}\n\nA sua certificação ${opts.certificationName} foi aprovada.\n\n${dashboardUrl}`,
  });
}

export async function sendCertificationRejectedEmail(opts: {
  to: string;
  customerName: string | null;
  certificationName?: string | null;
  reason: string;
}) {
  const dashboardUrl = `${SITE_URL}/dashboard/orders`;
  const greeting = emailGreeting(opts.customerName);
  const reason = escapeHtml(opts.reason);
  const certName = opts.certificationName?.trim() || null;
  const cert = certName ? escapeHtml(certName) : null;
  const subject = certName
    ? `Certificação recusada — ${certName}`
    : "Certificação recusada";
  const preheader = certName
    ? `A sua certificação ${certName} não foi aprovada`
    : "A sua certificação não foi aprovada";

  const certSentence = cert
    ? `A sua certificação <strong>${cert}</strong> não foi aprovada.`
    : "A sua certificação não foi aprovada.";
  const certSentenceText = certName
    ? `A sua certificação ${certName} não foi aprovada.`
    : "A sua certificação não foi aprovada.";

  await sendEmail({
    to: opts.to,
    subject,
    html: emailLayout({
      title: "Certificação recusada",
      preheader,
      bodyHtml: `
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;">${certSentence}</p>
        <p style="margin:0 0 12px;"><strong>Motivo:</strong></p>
        <p style="margin:0 0 12px; padding:12px; background:#f9fafb; border-radius:8px; white-space:pre-wrap;">${reason}</p>
        <p style="margin:0 0 12px;">Pode atualizar a sua certificação na área de cliente e voltar a submeter.</p>
        ${emailButton(dashboardUrl, "Ir para a área de cliente")}
      `,
    }),
    text: `${greeting.replace(/<[^>]+>/g, "")}\n\n${certSentenceText}\n\nMotivo: ${opts.reason}\n\n${dashboardUrl}`,
  });
}
