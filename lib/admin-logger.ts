import { db } from "@/lib/db";
import { AdminLogActionType } from "@prisma/client";

interface LogDetails {
  before?: any;
  after?: any;
  changes?: Record<string, { from: any; to: any }>;
  [key: string]: any;
}

interface LogMetadata {
  url?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Log an admin action to the database
 */
export async function logAdminAction({
  userId,
  actionType,
  resourceType,
  resourceId,
  description,
  details,
  ipAddress,
  userAgent,
  metadata,
}: {
  userId: string;
  actionType: AdminLogActionType | string;
  resourceType: string;
  resourceId?: string | null;
  description: string;
  details?: LogDetails;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: LogMetadata;
}) {
  try {
    console.log("🔵 LOGGING ADMIN ACTION:", {
      userId,
      actionType,
      resourceType,
      resourceId,
      description,
    });

    // Convert string actionType to enum if needed
    const actionTypeValue = typeof actionType === "string" ? actionType : actionType;

    const log = await db.adminLog.create({
      data: {
        userId,
        actionType: actionTypeValue as any, // Cast to any to handle string literals
        resourceType,
        resourceId: resourceId || null,
        description,
        details: details ? (typeof details === "object" ? details : JSON.parse(details)) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata ? (typeof metadata === "object" ? metadata : JSON.parse(metadata)) : null,
      },
    });

    console.log("✅ Admin action logged successfully:", log.id);
    return log;
  } catch (error: any) {
    // Log errors but don't throw - we don't want logging failures to break the main operation
    console.error("❌ FAILED TO LOG ADMIN ACTION:", {
      error: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.substring(0, 500),
      userId,
      actionType,
      resourceType,
      resourceId,
    });
    
    // If it's a database schema issue, log more details
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.error("⚠️ AdminLog table might not exist. Run database migration!");
    }
    
    // If it's a foreign key constraint issue
    if (error?.code === "P2003") {
      console.error("⚠️ Foreign key constraint failed - userId might not exist:", userId);
    }
    
    return null;
  }
}

/**
 * Helper function to extract IP address and user agent from Request
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const userAgent = request.headers.get("user-agent") || null;
  
  // Try to get IP address from various headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

  return { ipAddress, userAgent };
}

/**
 * Create a detailed log entry with before/after comparison
 */
export function createChangeDetails(before: any, after: any): LogDetails {
  const changes: Record<string, { from: any; to: any }> = {};
  
  // Compare objects and track changes
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  
  for (const key of allKeys) {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];
    
    // Only log if value actually changed
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes[key] = {
        from: beforeValue,
        to: afterValue,
      };
    }
  }
  
  return {
    before,
    after,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  };
}

/**
 * Helper to get a descriptive action description
 */
export function getActionDescription(
  actionType: AdminLogActionType,
  resourceType: string,
  resourceIdentifier?: string
): string {
  const identifier = resourceIdentifier ? ` "${resourceIdentifier}"` : "";
  
  switch (actionType) {
    case "CREATE":
      return `Created ${resourceType}${identifier}`;
    case "UPDATE":
      return `Updated ${resourceType}${identifier}`;
    case "DELETE":
      return `Deleted ${resourceType}${identifier}`;
    case "VIEW":
      return `Viewed ${resourceType}${identifier}`;
    case "EXPORT":
      return `Exported ${resourceType}${identifier}`;
    case "APPROVE":
      return `Approved ${resourceType}${identifier}`;
    case "REJECT":
      return `Rejected ${resourceType}${identifier}`;
    case "ACTIVATE":
      return `Activated ${resourceType}${identifier}`;
    case "DEACTIVATE":
      return `Deactivated ${resourceType}${identifier}`;
    case "BULK_OPERATION":
      return `Bulk operation on ${resourceType}${identifier}`;
    default:
      return `${actionType} on ${resourceType}${identifier}`;
  }
}

