"use client";

import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export function LocalizedLoading({
  className,
  messageKey = "common.loading",
}: {
  className?: string;
  messageKey?: string;
}) {
  const { t } = useLanguage();
  return <div className={cn(className)}>{t(messageKey)}</div>;
}
