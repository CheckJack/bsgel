import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildOrderInvoicePdf } from "@/lib/invoice/order-invoice";
import { isManualPaymentAwaiting } from "@/lib/order-status-display";

/**
 * Download PDF invoice (paid) or proforma (awaiting payment) for an order.
 * Owner or admin only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
        trainingItems: {
          include: { program: { select: { title: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isOwner = order.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const awaiting = isManualPaymentAwaiting({
      status: order.status,
      shopPaymentMethod: order.shopPaymentMethod,
      manualPaymentStatus: order.manualPaymentStatus,
      paymentIntentId: order.paymentIntentId,
    });

    const documentType = awaiting || order.status === "PENDING" ? "proforma" : "invoice";
    // Cancelled unpaid → still allow proforma download for records
    const pdf = await buildOrderInvoicePdf(order, documentType === "invoice" ? "invoice" : "proforma");

    return new NextResponse(new Uint8Array(pdf.content), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice PDF download failed:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
