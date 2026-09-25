import { NextResponse } from "next/server";
import { resolveOfflinePaymentCopy } from "@/lib/checkout/resolve-offline-payment-copy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public copy for MB Way / bank transfer instructions.
 */
export async function GET() {
  try {
    const { mbway, bankTransfer, details, expiryDays } = await resolveOfflinePaymentCopy();
    return NextResponse.json(
      { mbway, bankTransfer, details, expiryDays },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (e) {
    console.error("offline-payment-copy:", e);
    return NextResponse.json(
      {
        mbway:
          "<p>As instruções de pagamento estão temporariamente indisponíveis. Contacte <a href=\"mailto:info@biosculpture.pt\">info@biosculpture.pt</a>.</p>",
        bankTransfer:
          "<p>As instruções de pagamento estão temporariamente indisponíveis. Contacte <a href=\"mailto:info@biosculpture.pt\">info@biosculpture.pt</a>.</p>",
        details: {
          mbwayPhone: "",
          bankAccountName: "",
          bankName: "",
          bankIban: "",
          bankBic: "",
        },
        expiryDays: 5,
      },
      { status: 200 }
    );
  }
}
