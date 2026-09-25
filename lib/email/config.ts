/** Shared email / cron configuration from env. */

/** True when Brevo API or SMTP credentials are present. */
export function isEmailConfigured(): boolean {
  if (process.env.BREVO_API_KEY?.trim()) return true;
  const user = process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS;
  return Boolean(user && pass);
}

/** Live shop origin for buttons and reset links (not WordPress). */
export const APP_URL = (
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** Brand URL shown in email footers. */
export const EMAIL_BRAND_URL = (
  process.env.EMAIL_SITE_URL ||
  "https://biosculpture.pt"
).replace(/\/$/, "");

/** Functional site origin used in email CTAs. */
export const SITE_URL = APP_URL;

export const CRON_SECRET = process.env.CRON_SECRET || "";

/** Days after delivery / training completion before sending review request. */
export const REVIEW_DELAY_DAYS = Number(process.env.REVIEW_DELAY_DAYS || 4);

/** Days of cart inactivity before abandonment email. */
export const ABANDONMENT_DAYS = Number(process.env.ABANDONMENT_DAYS || 5);

/** Email verification code lifetime. */
export const CODE_TTL_MINUTES = Number(process.env.CODE_TTL_MINUTES || 30);

/** Password reset token lifetime. */
export const RESET_TTL_HOURS = Number(process.env.RESET_TTL_HOURS || 1);

/** Days before unpaid MB Way / bank transfer orders expire and stock is restored. */
export const OFFLINE_PAYMENT_EXPIRY_DAYS = Number(
  process.env.OFFLINE_PAYMENT_EXPIRY_DAYS || 5
);

/** Re-send cart abandonment at most once per this many days. */
export const ABANDONMENT_RESEND_DAYS = Number(process.env.ABANDONMENT_RESEND_DAYS || 30);
