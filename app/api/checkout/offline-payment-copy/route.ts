import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const MBWAY_KEY = "checkout_mbway_instructions"
const BANK_KEY = "checkout_bank_transfer_instructions"

/**
 * Public copy for MBWay / bank transfer instructions (trusted HTML or plain text from DB or env).
 */
export async function GET() {
  try {
    const [mbRow, bankRow] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: MBWAY_KEY } }),
      db.systemSettings.findUnique({ where: { key: BANK_KEY } }),
    ])

    const mbway =
      mbRow?.value?.trim() ||
      process.env.CHECKOUT_MBWAY_INSTRUCTIONS?.trim() ||
      "<p>Configure payment instructions in Admin → System settings (keys <code>checkout_mbway_instructions</code>) or set <code>CHECKOUT_MBWAY_INSTRUCTIONS</code> in the server environment.</p>"

    const bankTransfer =
      bankRow?.value?.trim() ||
      process.env.CHECKOUT_BANK_TRANSFER_INSTRUCTIONS?.trim() ||
      "<p>Configure payment instructions in Admin → System settings (keys <code>checkout_bank_transfer_instructions</code>) or set <code>CHECKOUT_BANK_TRANSFER_INSTRUCTIONS</code> in the server environment.</p>"

    return NextResponse.json({ mbway, bankTransfer })
  } catch (e) {
    console.error("offline-payment-copy:", e)
    return NextResponse.json(
      {
        mbway: "<p>Payment instructions are temporarily unavailable.</p>",
        bankTransfer: "<p>Payment instructions are temporarily unavailable.</p>",
      },
      { status: 200 }
    )
  }
}
