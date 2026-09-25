import { NextResponse } from "next/server";
import { isAdminAiEnabled, getGeminiApiKey } from "@/lib/admin-ai/config";
import { requireAdminAi } from "@/lib/admin-ai/auth";

export async function GET() {
  const { error, session } = await requireAdminAi();
  if (error) {
    if (!isAdminAiEnabled()) {
      return NextResponse.json({ enabled: false, reason: "disabled" });
    }
    return error;
  }

  return NextResponse.json({
    enabled: true,
    configured: !!getGeminiApiKey(),
    userId: session!.user.id,
  });
}
