"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { getQuickActionsForPage, getQuickActionPrompt, type QuickAction } from "@/lib/admin-ai/quick-actions";
import { cn } from "@/lib/utils";

export function AdminAiQuickActions({ onSelect }: { onSelect: (prompt: string) => void }) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const actions = getQuickActionsForPage(pathname || "/admin");

  if (!actions.length) return null;

  return (
    <div className="space-y-2 pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {t("adminAi.quickActions")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action: QuickAction) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelect(getQuickActionPrompt(action, language))}
            className={cn(
              "rounded-full border border-[#857D71]/30 bg-[#857D71]/5 px-2.5 py-1 text-xs",
              "text-[#6b6358] transition hover:border-[#857D71]/50 hover:bg-[#857D71]/10"
            )}
          >
            {t(`adminAi.quick.${action.labelKey}` as "adminAi.quick.dashboardStats")}
          </button>
        ))}
      </div>
    </div>
  );
}
