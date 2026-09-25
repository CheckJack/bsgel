import { sendEmail } from "@/lib/email/send";
import {
  EMAIL_BRAND_CHAMPAGNE,
  emailButton,
  emailGreeting,
  emailLayout,
  escapeHtml,
} from "@/lib/email/layout";
import { SITE_URL } from "@/lib/email/config";

export async function sendEmailVerificationCode(opts: {
  to: string;
  name?: string | null;
  code: string;
  pendingCertification?: boolean;
  certificationName?: string | null;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const certLine = opts.pendingCertification
    ? `A sua certificação profissional${
        opts.certificationName ? ` (${escapeHtml(opts.certificationName)})` : ""
      } foi submetida e aguarda revisão. Será notificado(a) assim que for aprovada.`
    : "";
  const certNote = certLine
    ? `<p style="margin:16px 0 0;">${certLine}</p>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">Bem-vindo(a) à Bio Sculpture. Por favor, confirme o seu endereço de e-mail com este código:</p>
    <p style="margin:20px 0;font-size:28px;letter-spacing:0.35em;font-weight:700;text-align:center;font-family:Helvetica,Arial,sans-serif;">
      ${escapeHtml(opts.code)}
    </p>
    <p style="margin:0;color:#666;font-size:13px;">Este código expira dentro de 30 minutos. Se não criou uma conta, pode ignorar este e-mail.</p>
    ${certNote}
  `;

  return sendEmail({
    to: opts.to,
    subject: "Confirme o seu e-mail — Bio Sculpture",
    html: emailLayout({
      title: "Confirme o seu e-mail",
      preheader: `O seu código de confirmação é ${opts.code}`,
      bodyHtml,
    }),
    text: `${greeting.replace(/<[^>]+>/g, "")}\n\nBem-vindo(a) à Bio Sculpture. Por favor, confirme o seu endereço de e-mail com este código:\n\nO seu código de confirmação: ${opts.code}\n\nEste código expira dentro de 30 minutos.${certLine ? `\n\n${certLine.replace(/<[^>]+>/g, "")}` : ""}\n${SITE_URL}`,
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name?: string | null;
  resetUrl: string;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">Recebemos um pedido para redefinir a sua palavra-passe. Clique no botão abaixo para escolher uma nova:</p>
    ${emailButton(opts.resetUrl, "Redefinir palavra-passe", EMAIL_BRAND_CHAMPAGNE)}
    <p style="margin:0;color:#666;font-size:13px;">Esta hiperligação expira dentro de 1 hora. Se não fez este pedido, pode ignorar este e-mail.</p>
  `;

  return sendEmail({
    to: opts.to,
    subject: "Redefinir a sua palavra-passe — Bio Sculpture",
    html: emailLayout({
      title: "Redefinir palavra-passe",
      preheader: "Redefina a sua palavra-passe Bio Sculpture",
      bodyHtml,
    }),
    text: `${greeting.replace(/<[^>]+>/g, "")}\n\nRedefinir a sua palavra-passe: ${opts.resetUrl}\n\nEsta hiperligação expira dentro de 1 hora.`,
  });
}
