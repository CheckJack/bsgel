import type { Prisma } from "@prisma/client";
import type { AdminAiChatMessageMeta } from "@/lib/admin-ai/types";

export function toMessageMetadata(meta: AdminAiChatMessageMeta): Prisma.InputJsonValue {
  return meta as Prisma.InputJsonValue;
}
