import { db } from "@/lib/db";
import {
  BANK_ACCOUNT_NAME_KEY,
  BANK_BIC_KEY,
  BANK_IBAN_KEY,
  BANK_NAME_KEY,
  BANK_INSTRUCTIONS_KEY,
  MBWAY_INSTRUCTIONS_KEY,
  MBWAY_PHONE_KEY,
  buildBankTransferInstructionsHtml,
  buildMbwayInstructionsHtml,
  mergeOfflinePaymentDetails,
  offlinePaymentExpiryDays,
  type OfflinePaymentDetails,
} from "@/lib/checkout/offline-payment-instructions";

export type ResolvedOfflinePaymentCopy = {
  details: OfflinePaymentDetails;
  mbway: string;
  bankTransfer: string;
  expiryDays: number;
};

async function readSettingsMap(keys: string[]): Promise<Map<string, string>> {
  const rows = await db.systemSettings.findMany({
    where: { key: { in: keys } },
  });
  return new Map(rows.map((row) => [row.key, row.value ?? ""]));
}

export async function resolveOfflinePaymentCopy(): Promise<ResolvedOfflinePaymentCopy> {
  const map = await readSettingsMap([
    MBWAY_PHONE_KEY,
    BANK_ACCOUNT_NAME_KEY,
    BANK_NAME_KEY,
    BANK_IBAN_KEY,
    BANK_BIC_KEY,
  ]);

  const details = mergeOfflinePaymentDetails({
    mbwayPhone: map.get(MBWAY_PHONE_KEY),
    bankAccountName: map.get(BANK_ACCOUNT_NAME_KEY),
    bankName: map.get(BANK_NAME_KEY),
    bankIban: map.get(BANK_IBAN_KEY),
    bankBic: map.get(BANK_BIC_KEY),
  });

  const mbway = buildMbwayInstructionsHtml(details);
  const bankTransfer = buildBankTransferInstructionsHtml(details);

  return { details, mbway, bankTransfer, expiryDays: offlinePaymentExpiryDays() };
}

export async function saveOfflinePaymentDetails(
  details: OfflinePaymentDetails,
  options?: { regenerateHtml?: boolean }
): Promise<ResolvedOfflinePaymentCopy> {
  const cleaned = mergeOfflinePaymentDetails(details);
  const mbwayHtml = buildMbwayInstructionsHtml(cleaned);
  const bankHtml = buildBankTransferInstructionsHtml(cleaned);
  const regenerateHtml = options?.regenerateHtml !== false;

  const upserts: Array<{ key: string; value: string; description: string }> = [
    {
      key: MBWAY_PHONE_KEY,
      value: cleaned.mbwayPhone,
      description: "MB Way phone number shown at checkout",
    },
    {
      key: BANK_ACCOUNT_NAME_KEY,
      value: cleaned.bankAccountName,
      description: "Bank transfer beneficiary name",
    },
    {
      key: BANK_NAME_KEY,
      value: cleaned.bankName,
      description: "Bank name shown at checkout",
    },
    {
      key: BANK_IBAN_KEY,
      value: cleaned.bankIban,
      description: "Bank transfer IBAN",
    },
    {
      key: BANK_BIC_KEY,
      value: cleaned.bankBic,
      description: "Bank transfer BIC/SWIFT (optional)",
    },
  ];

  if (regenerateHtml) {
    upserts.push(
      {
        key: MBWAY_INSTRUCTIONS_KEY,
        value: mbwayHtml,
        description: "HTML instructions for MB Way at checkout",
      },
      {
        key: BANK_INSTRUCTIONS_KEY,
        value: bankHtml,
        description: "HTML instructions for bank transfer at checkout",
      }
    );
  }

  await Promise.all(
    upserts.map((row) =>
      db.systemSettings.upsert({
        where: { key: row.key },
        update: { value: row.value, description: row.description },
        create: {
          key: row.key,
          value: row.value,
          description: row.description,
        },
      })
    )
  );

  return {
    details: cleaned,
    mbway: mbwayHtml,
    bankTransfer: bankHtml,
    expiryDays: offlinePaymentExpiryDays(),
  };
}
