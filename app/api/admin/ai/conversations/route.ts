import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAi } from "@/lib/admin-ai/auth";

export async function GET(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const conversations = await db.adminAiConversation.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      pageContext: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const { pageContext } = await req.json().catch(() => ({}));

  const conversation = await db.adminAiConversation.create({
    data: {
      userId: session!.user.id,
      pageContext: pageContext || null,
    },
  });

  return NextResponse.json({ conversation });
}
