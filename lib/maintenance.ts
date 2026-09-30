import { db } from "@/lib/db";

export const MAINTENANCE_SETTING_KEY = "maintenanceMode";

/** Emergency override: set MAINTENANCE_FORCE_OFF=true to always open the site. */
export function isMaintenanceForceOff() {
  return process.env.MAINTENANCE_FORCE_OFF === "true";
}

export async function getMaintenanceMode(): Promise<boolean> {
  if (isMaintenanceForceOff()) return false;

  try {
    const row = await db.systemSettings.findUnique({
      where: { key: MAINTENANCE_SETTING_KEY },
    });
    return row?.value === "true";
  } catch {
    // Fail open if settings table is unavailable — avoids locking the site on deploy glitches.
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean) {
  await db.systemSettings.upsert({
    where: { key: MAINTENANCE_SETTING_KEY },
    update: {
      value: enabled ? "true" : "false",
      description: "When true, public visitors see Coming Soon; ADMIN users retain full access.",
    },
    create: {
      key: MAINTENANCE_SETTING_KEY,
      value: enabled ? "true" : "false",
      description: "When true, public visitors see Coming Soon; ADMIN users retain full access.",
    },
  });
}
