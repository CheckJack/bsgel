import { NextResponse } from "next/server";
import { getMaintenanceMode } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Lightweight public status for middleware / health checks.
 * Only exposes the maintenance flag — nothing sensitive.
 */
export async function GET() {
  const maintenanceMode = await getMaintenanceMode();
  return NextResponse.json(
    { maintenanceMode },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    }
  );
}
