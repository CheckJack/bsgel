"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, RotateCcw, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { AdminAiRichPreview, AdminAiActionLink } from "@/lib/admin-ai/types";

function translateLinkLabel(label: string, t: (key: string) => string): string {
  const keyMap: Record<string, string> = {
    "Edit draft": "adminAi.editDraft",
    "View product": "adminAi.viewProduct",
    "View order": "adminAi.viewOrder",
    "Open stock": "adminAi.openStock",
    "View coupon": "adminAi.viewCoupon",
    "Stock": "adminAi.openStock",
  };
  const key = keyMap[label];
  return key ? t(key) : label;
}

export function AdminAiSuccessCard({
  title,
  summary,
  details,
  links,
  undo,
  onUndo,
  undoing,
}: {
  title: string;
  summary?: string;
  details?: { label: string; value: string }[];
  links?: AdminAiActionLink[];
  undo?: { id: string; description: string; expiresAt: string };
  onUndo?: (id: string) => void;
  undoing?: boolean;
}) {
  const { t } = useLanguage();
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!undo) return;
    const tick = () => {
      const ms = new Date(undo.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining("");
        return;
      }
      const min = Math.ceil(ms / 60000);
      setRemaining(`${min}m`);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [undo]);

  const primaryLink = links?.[0];
  const secondaryLinks = links?.slice(1) ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex gap-3 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#857D71]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
          {summary && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{summary}</p>
          )}
        </div>
      </div>

      {details && details.length > 0 && (
        <div className="space-y-1 border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
          {details.map((row) => (
            <div key={row.label} className="flex gap-2 text-xs">
              <span className="shrink-0 text-gray-400">{row.label}</span>
              <span className="truncate text-gray-700 dark:text-gray-300">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
        {primaryLink && (
          <Link
            href={primaryLink.href}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#857D71] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#6b6358]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {translateLinkLabel(primaryLink.label, t)}
          </Link>
        )}

        {secondaryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {translateLinkLabel(link.label, t)}
          </Link>
        ))}

        {undo && remaining && onUndo && (
          <button
            type="button"
            onClick={() => onUndo(undo.id)}
            disabled={undoing}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {undoing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            {t("adminAi.undo")}
            <span className="text-gray-400">· {remaining}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function buildSuccessCardProps(
  richPreview: AdminAiRichPreview | undefined,
  fallbackContent: string,
  t: (key: string) => string
): { title: string; summary?: string; details?: { label: string; value: string }[] } {
  if (richPreview) {
    const details = richPreview.rows
      .filter((r) => r.detail && !["Section", "Title"].includes(r.label))
      .slice(0, 3)
      .map((r) => ({
        label: r.label,
        value: r.detail || r.after || "",
      }));

    const title =
      richPreview.summary ||
      richPreview.rows.find((r) => r.label === "Title")?.detail ||
      richPreview.title ||
      t("adminAi.applied");

    return {
      title: title.replace(/^"|"$/g, ""),
      summary: t("adminAi.successSubtitle"),
      details: details.length ? details : undefined,
    };
  }

  const cleaned = fallbackContent.replace(/^✓\s*/, "").trim();
  const firstLine = cleaned.split("\n")[0] || t("adminAi.applied");
  return { title: firstLine.slice(0, 120), summary: t("adminAi.successSubtitle") };
}
