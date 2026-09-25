import { sendEmail } from "@/lib/email/send";
import { emailButton, emailGreeting, emailLayout, escapeHtml } from "@/lib/email/layout";
import { SITE_URL } from "@/lib/email/config";

type TrainingProgramInfo = {
  title: string;
  description?: string | null;
};

type TrainingSessionInfo = {
  startDate: Date | string;
  endDate?: Date | string | null;
  location?: string | null;
  format?: string | null;
};

function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLabel(format?: string | null): string {
  switch (String(format || "").toUpperCase()) {
    case "PRESENTIAL":
    case "IN_PERSON":
      return "Presencial";
    case "ONLINE":
      return "Online";
    case "HYBRID":
      return "Híbrido";
    default:
      return format ? String(format) : "A confirmar";
  }
}

export async function sendTrainingCourseInfoEmail(opts: {
  to: string;
  name?: string | null;
  program: TrainingProgramInfo;
  session: TrainingSessionInfo;
  bookingId: string;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const title = escapeHtml(opts.program.title);
  const location = opts.session.location
    ? escapeHtml(opts.session.location)
    : "A confirmar";

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">A sua inscrição na formação está confirmada. Seguem os detalhes de <strong>${title}</strong>:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0;background:#f8f6f3;padding:4px;">
      <tr><td style="padding:10px 14px;color:#666;width:120px;">Início</td><td style="padding:10px 14px;">${escapeHtml(formatDate(opts.session.startDate))}</td></tr>
      ${
        opts.session.endDate
          ? `<tr><td style="padding:10px 14px;color:#666;">Fim</td><td style="padding:10px 14px;">${escapeHtml(formatDate(opts.session.endDate))}</td></tr>`
          : ""
      }
      <tr><td style="padding:10px 14px;color:#666;">Local</td><td style="padding:10px 14px;">${location}</td></tr>
      <tr><td style="padding:10px 14px;color:#666;">Formato</td><td style="padding:10px 14px;">${escapeHtml(formatLabel(opts.session.format))}</td></tr>
    </table>
    ${
      opts.program.description
        ? `<p style="margin:0 0 16px;color:#555;">${escapeHtml(opts.program.description).slice(0, 500)}</p>`
        : ""
    }
    ${emailButton(`${SITE_URL}/dashboard/orders`, "Ver na área de cliente")}
    <p style="margin:0;font-size:12px;color:#888;">Referência da inscrição: ${escapeHtml(opts.bookingId.slice(0, 8).toUpperCase())}</p>
  `;

  return sendEmail({
    to: opts.to,
    subject: `Detalhes da formação — ${opts.program.title}`,
    html: emailLayout({
      title: "Informação da formação",
      preheader: `Detalhes de ${opts.program.title}`,
      bodyHtml,
    }),
  });
}

export async function sendTrainingReviewRequestEmail(opts: {
  to: string;
  name?: string | null;
  programTitle: string;
  reviewUrl?: string;
}): Promise<boolean> {
  const greeting = emailGreeting(opts.name);
  const url = opts.reviewUrl || `${SITE_URL}/dashboard/orders`;
  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;">Obrigado por concluir <strong>${escapeHtml(opts.programTitle)}</strong>. Gostaríamos de saber como correu.</p>
    ${emailButton(url, "Partilhar a sua opinião")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `Como correu ${opts.programTitle}? — Bio Sculpture`,
    html: emailLayout({
      title: "Avaliação da formação",
      preheader: `Partilhe a sua opinião sobre ${opts.programTitle}`,
      bodyHtml,
    }),
  });
}
