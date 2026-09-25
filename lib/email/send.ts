import fs from "fs";
import path from "path";
import { EMAIL_LOGO_CID } from "@/lib/email/layout";

type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
  cid?: string;
  contentDisposition?: "inline" | "attachment";
};

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

type ParsedFrom = { name?: string; email: string };

function parseFrom(raw: string): ParsedFrom {
  const match = raw.match(/^\s*(?:"?([^"<]*)"?\s*)?<\s*([^>]+)\s*>\s*$/);
  if (match) {
    const name = match[1]?.trim();
    return { name: name || undefined, email: match[2].trim() };
  }
  return { email: raw.trim() };
}

function getFromAddress(): string {
  return (
    process.env.BREVO_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "noreply@biosculpture.com"
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getInlineLogoAttachment(): EmailAttachment | null {
  const candidates = [
    path.join(process.cwd(), "public", "email-logo.png"),
    path.join(process.cwd(), "public", "bio-sculpture-black.png"),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      return {
        filename: "bio-sculpture-logo.png",
        content: fs.readFileSync(file),
        contentType: "image/png",
        cid: EMAIL_LOGO_CID,
        contentDisposition: "inline",
      };
    } catch {
      // try next
    }
  }
  return null;
}

/** Send via Brevo Transactional API (preferred). */
async function sendViaBrevoApi(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return false;

  const from = parseFrom(getFromAddress());
  const text = opts.text || stripHtml(opts.html);

  const payload: Record<string, unknown> = {
    sender: {
      email: from.email,
      ...(from.name ? { name: from.name } : {}),
    },
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
    textContent: text,
  };

  if (opts.attachments?.length) {
    payload.attachment = opts.attachments.map((a) => ({
      name: a.filename,
      content: a.content.toString("base64"),
    }));
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Brevo API failed:", res.status, body);
    return false;
  }

  return true;
}

/** Send via SMTP — defaults to Brevo relay when host unset but SMTP creds exist. */
async function sendViaSmtp(opts: SendEmailOptions): Promise<boolean> {
  const user = process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || (user && pass ? "smtp-relay.brevo.com" : undefined);
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const from = getFromAddress();

  if (!host || !user || !pass) {
    return false;
  }

  const logo = getInlineLogoAttachment();
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || stripHtml(opts.html),
    attachments: [
      ...(logo
        ? [
            {
              filename: logo.filename,
              content: logo.content,
              contentType: logo.contentType,
              cid: logo.cid,
              contentDisposition: "inline" as const,
            },
          ]
        : []),
      ...(opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType || "application/pdf",
        cid: a.cid,
        contentDisposition: a.contentDisposition || ("attachment" as const),
      })) ?? []),
    ],
  });

  return true;
}

/**
 * Sends transactional email via Brevo (API preferred, SMTP fallback).
 * If neither is configured, logs and returns false (dev-safe).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const { to, subject } = opts;

  try {
    if (process.env.BREVO_API_KEY?.trim()) {
      const ok = await sendViaBrevoApi(opts);
      if (ok) return true;
      console.warn("[email] Brevo API send failed; not falling back to SMTP for same message");
      return false;
    }

    const smtpOk = await sendViaSmtp(opts);
    if (smtpOk) return true;

    console.log("[email] Brevo/SMTP not configured — skipped:", { to, subject });
    return false;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}
