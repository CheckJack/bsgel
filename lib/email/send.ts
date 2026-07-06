type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** Sends email when SMTP is configured; otherwise logs (dev-safe). */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@biosculpture.com";

  if (!host || !user || !pass) {
    console.log("[email] SMTP not configured — skipped:", { to, subject });
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}
