"use client";

import { Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function AdminAiYesNoButtons({
  onYes,
  onNo,
  disabled,
}: {
  onYes: () => void;
  onNo: () => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onYes}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#857D71] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#6b6358] disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
        {t("adminAi.yes")}
      </button>
      <button
        type="button"
        onClick={onNo}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <X className="h-3.5 w-3.5" />
        {t("adminAi.no")}
      </button>
    </div>
  );
}
