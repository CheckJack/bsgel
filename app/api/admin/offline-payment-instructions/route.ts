import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";
import {
  resolveOfflinePaymentCopy,
  saveOfflinePaymentDetails,
} from "@/lib/checkout/resolve-offline-payment-copy";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const copy = await resolveOfflinePaymentCopy();
    return NextResponse.json({
      mbwayPhone: copy.details.mbwayPhone,
      bankAccountName: copy.details.bankAccountName,
      bankName: copy.details.bankName,
      bankIban: copy.details.bankIban,
      bankBic: copy.details.bankBic,
      mbwayHtml: copy.mbway,
      bankTransferHtml: copy.bankTransfer,
    });
  } catch (error) {
    console.error("admin offline-payment-instructions GET:", error);
    return NextResponse.json(
      { error: "Failed to load payment instructions" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const mbwayPhone = typeof body.mbwayPhone === "string" ? body.mbwayPhone.trim() : "";
    const bankAccountName =
      typeof body.bankAccountName === "string" ? body.bankAccountName.trim() : "";
    const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
    const bankIban = typeof body.bankIban === "string" ? body.bankIban.trim() : "";
    const bankBic = typeof body.bankBic === "string" ? body.bankBic.trim() : "";

    if (!mbwayPhone) {
      return NextResponse.json(
        { error: "MB Way phone number is required" },
        { status: 400 }
      );
    }
    if (!bankAccountName) {
      return NextResponse.json(
        { error: "Bank account beneficiary name is required" },
        { status: 400 }
      );
    }
    if (!bankName) {
      return NextResponse.json({ error: "Bank name is required" }, { status: 400 });
    }

    const saved = await saveOfflinePaymentDetails({
      mbwayPhone,
      bankAccountName,
      bankName,
      bankIban,
      bankBic,
    });

    await logAdminAction({
      userId: session.user.id,
      actionType: "UPDATE",
      resourceType: "SystemSettings",
      description: "Updated offline payment instructions (MB Way / bank transfer)",
      details: {
        mbwayPhone: saved.details.mbwayPhone,
        bankAccountName: saved.details.bankAccountName,
        bankNameSet: Boolean(saved.details.bankName),
        bankIbanSet: Boolean(saved.details.bankIban),
        bankBicSet: Boolean(saved.details.bankBic),
      },
    });

    return NextResponse.json({
      success: true,
      mbwayPhone: saved.details.mbwayPhone,
      bankAccountName: saved.details.bankAccountName,
      bankName: saved.details.bankName,
      bankIban: saved.details.bankIban,
      bankBic: saved.details.bankBic,
      mbwayHtml: saved.mbway,
      bankTransferHtml: saved.bankTransfer,
    });
  } catch (error) {
    console.error("admin offline-payment-instructions PUT:", error);
    return NextResponse.json(
      { error: "Failed to save payment instructions" },
      { status: 500 }
    );
  }
}
