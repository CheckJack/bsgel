import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const voteType = body?.type as "helpful" | "notHelpful";

    if (voteType !== "helpful" && voteType !== "notHelpful") {
      return NextResponse.json({ error: "Tipo de voto inválido" }, { status: 400 });
    }

    const updated = await db.productReview.update({
      where: { id },
      data:
        voteType === "helpful"
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      select: {
        id: true,
        helpfulCount: true,
        notHelpfulCount: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Falha ao registar voto da avaliação:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao registar voto" },
      { status: 500 }
    );
  }
}
