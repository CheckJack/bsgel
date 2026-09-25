import { OFFLINE_PAYMENT_EXPIRY_DAYS } from "@/lib/email/config";

export const MBWAY_INSTRUCTIONS_KEY = "checkout_mbway_instructions";
export const BANK_INSTRUCTIONS_KEY = "checkout_bank_transfer_instructions";
export const MBWAY_PHONE_KEY = "checkout_mbway_phone";
export const BANK_ACCOUNT_NAME_KEY = "checkout_bank_account_name";
export const BANK_NAME_KEY = "checkout_bank_name";
export const BANK_IBAN_KEY = "checkout_bank_iban";
export const BANK_BIC_KEY = "checkout_bank_bic";

export type OfflinePaymentDetails = {
  mbwayPhone: string;
  bankAccountName: string;
  bankName: string;
  bankIban: string;
  bankBic: string;
};

const DEFAULT_MBWAY_PHONE = "+351 935 172 295";
const DEFAULT_BANK_ACCOUNT_NAME = "BS Gel lda";
const DEFAULT_BANK_NAME = "Santander";
const DEFAULT_BANK_IBAN = "PT50001800032118736402088";
const BRAND_CHAMPAGNE = "#857D71";

export function envOfflinePaymentDetails(): OfflinePaymentDetails {
  return {
    mbwayPhone:
      process.env.CHECKOUT_MBWAY_PHONE?.trim() || DEFAULT_MBWAY_PHONE,
    bankAccountName:
      process.env.CHECKOUT_BANK_ACCOUNT_NAME?.trim() || DEFAULT_BANK_ACCOUNT_NAME,
    bankName: process.env.CHECKOUT_BANK_NAME?.trim() || DEFAULT_BANK_NAME,
    bankIban: process.env.CHECKOUT_BANK_IBAN?.trim() || DEFAULT_BANK_IBAN,
    bankBic: process.env.CHECKOUT_BANK_BIC?.trim() || "",
  };
}

export function offlinePaymentExpiryDays(): number {
  return Number.isFinite(OFFLINE_PAYMENT_EXPIRY_DAYS)
    ? Math.max(1, OFFLINE_PAYMENT_EXPIRY_DAYS)
    : 5;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailTable(rows: Array<{ label: string; valueHtml: string }>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid #e8e4de;background:#faf9f7;">
    ${rows
      .map(
        (row, i) => `<tr>
      <td style="padding:14px 16px;${i < rows.length - 1 ? "border-bottom:1px solid #eee8e0;" : ""}">
        <p style="margin:0 0 5px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND_CHAMPAGNE};font-family:Helvetica,Arial,sans-serif;">${row.label}</p>
        <p style="margin:0;font-size:14px;line-height:1.5;letter-spacing:0;color:#333;font-family:Helvetica,Arial,sans-serif;">${row.valueHtml}</p>
      </td>
    </tr>`
      )
      .join("")}
  </table>`;
}

function stepsTable(steps: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
    ${steps
      .map(
        (step, i) => `<tr>
      <td style="padding:5px 10px 5px 0;font-size:11px;letter-spacing:0.08em;color:${BRAND_CHAMPAGNE};font-family:Helvetica,Arial,sans-serif;vertical-align:top;width:22px;">${String(i + 1).padStart(2, "0")}</td>
      <td style="padding:5px 0;font-size:14px;line-height:1.5;color:#333;font-family:Helvetica,Arial,sans-serif;">${step}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

function brandedInstructions(opts: {
  eyebrow: string;
  rows: Array<{ label: string; valueHtml: string }>;
  steps: string[];
  footer: string;
}): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND_CHAMPAGNE};">${opts.eyebrow}</p>
    ${detailTable(opts.rows)}
    ${stepsTable(opts.steps)}
    <p style="margin:0;font-size:12px;line-height:1.55;color:#8a8680;">${opts.footer}</p>
  </div>`;
}

/** Customer-facing MB Way instructions (Portuguese — primary shop language). */
export function buildMbwayInstructionsHtml(details: OfflinePaymentDetails): string {
  const phone = details.mbwayPhone.trim() || DEFAULT_MBWAY_PHONE;
  return brandedInstructions({
    eyebrow: "MB Way",
    rows: [{ label: "Número", valueHtml: escapeHtml(phone) }],
    steps: [
      "Abra a aplicação MB Way ou a app do seu banco.",
      "Escolha <strong>Enviar dinheiro</strong> e transfira o valor total da encomenda.",
      "No descritivo, indique o <strong>número da encomenda</strong>.",
    ],
    footer: "Confirmamos a encomenda assim que o pagamento for recebido.",
  });
}

/** Customer-facing bank transfer instructions (Portuguese). */
export function buildBankTransferInstructionsHtml(
  details: OfflinePaymentDetails
): string {
  const name = details.bankAccountName.trim() || DEFAULT_BANK_ACCOUNT_NAME;
  const bankName = details.bankName.trim() || DEFAULT_BANK_NAME;
  const iban = details.bankIban.trim() || DEFAULT_BANK_IBAN;
  const bic = details.bankBic.trim();

  const rows: Array<{ label: string; valueHtml: string }> = [
    { label: "Beneficiário", valueHtml: escapeHtml(name) },
    { label: "Banco", valueHtml: escapeHtml(bankName) },
    { label: "IBAN", valueHtml: escapeHtml(iban) },
  ];

  if (bic) {
    rows.push({ label: "BIC / SWIFT", valueHtml: escapeHtml(bic) });
  }

  return brandedInstructions({
    eyebrow: "Transferência bancária",
    rows,
    steps: [
      "Transfira o <strong>valor total</strong> da encomenda para a conta indicada.",
      "No descritivo, indique o <strong>número da encomenda</strong>.",
      "Guarde o comprovativo até confirmarmos o pagamento.",
    ],
    footer: "Confirmamos a encomenda assim que o valor for creditado.",
  });
}

export function mergeOfflinePaymentDetails(
  stored: Partial<OfflinePaymentDetails> | null | undefined
): OfflinePaymentDetails {
  const fromEnv = envOfflinePaymentDetails();
  return {
    mbwayPhone: stored?.mbwayPhone?.trim() || fromEnv.mbwayPhone,
    bankAccountName: stored?.bankAccountName?.trim() || fromEnv.bankAccountName,
    bankName: stored?.bankName?.trim() || fromEnv.bankName,
    bankIban: stored?.bankIban?.trim() || fromEnv.bankIban,
    bankBic: stored?.bankBic?.trim() || fromEnv.bankBic,
  };
}
