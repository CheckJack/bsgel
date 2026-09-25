import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isAdminAiEnabled } from "@/lib/admin-ai/config";

export async function requireAdminAi() {
  if (!isAdminAiEnabled()) {
    return {
      error: NextResponse.json({ error: "Admin AI is disabled" }, { status: 404 }),
      session: null,
    };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}
