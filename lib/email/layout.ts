import { EMAIL_BRAND_URL } from "@/lib/email/config";

type EmailLayoutOptions = {
  title?: string;
  preheader?: string;
  bodyHtml: string;
};

/** Inline CID — attached in send.ts so Gmail does not fetch biosculpture.pt (WordPress 404). */
export const EMAIL_LOGO_CID = "biosculpture-logo";
const LOGO_SRC = `cid:${EMAIL_LOGO_CID}`;
const BRAND_HOST = EMAIL_BRAND_URL.replace(/^https?:\/\//, "");

/** Branded HTML wrapper for transactional emails (European Portuguese). */
export function emailLayout({ title, preheader, bodyHtml }: EmailLayoutOptions): string {
  const safePreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${title ? `<title>${escapeHtml(title)}</title>` : ""}
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  ${safePreheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #eee;">
              <a href="${EMAIL_BRAND_URL}" style="text-decoration:none;display:inline-block;">
                <img src="${LOGO_SRC}" alt="Bio Sculpture" width="156" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:156px;width:156px;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#333;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #eee;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#888;">
              <p style="margin:0 0 8px;">© ${new Date().getFullYear()} Bio Sculpture. Todos os direitos reservados.</p>
              <p style="margin:0;"><a href="${EMAIL_BRAND_URL}" style="color:#888;">${escapeHtml(BRAND_HOST)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Header / nav champagne (Pantone 8003c). */
export const EMAIL_BRAND_CHAMPAGNE = "#857D71";

export function emailButton(
  href: string,
  label: string,
  background = "#1a1a1a"
): string {
  return `<p style="margin:24px 0;">
  <a href="${href}" style="display:inline-block;background:${background};color:#ffffff;text-decoration:none;padding:12px 22px;font-size:14px;font-weight:600;letter-spacing:0.02em;">
    ${escapeHtml(label)}
  </a>
</p>`;
}

export function emailGreeting(name?: string | null): string {
  return name ? `Olá ${escapeHtml(name)},` : "Olá,";
}
