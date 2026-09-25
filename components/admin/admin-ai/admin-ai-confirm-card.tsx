"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Ban, Loader2, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { AdminAiRichPreview, AdminAiActionLink } from "@/lib/admin-ai/types";

type Props = {
  preview?: AdminAiRichPreview;
  fallbackText?: string;
  links?: AdminAiActionLink[];
  expiresAt?: string;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function formatCountdown(ms: number, t: (key: string) => string): string {
  if (ms <= 0) return t("adminAi.expired");
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function AdminAiConfirmCard({
  preview,
  fallbackText,
  links,
  expiresAt,
  confirming,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useLanguage();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(ms);
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const isExpired = remainingMs !== null && remainingMs <= 0;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-amber-300/60 bg-amber-50/90 dark:border-amber-700 dark:bg-amber-950/40">
      <div className="border-b border-amber-200/80 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
            {t("adminAi.confirmTitle")}
          </p>
          {remainingMs !== null && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-amber-800/80 dark:text-amber-200/80">
              <Clock className="h-3 w-3" />
              {t("adminAi.expiresIn")} {formatCountdown(remainingMs, t)}
            </span>
          )}
        </div>
        {preview && (
          <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/90">{preview.summary}</p>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto px-3 py-2">
        {preview && preview.rows.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-amber-200/60 text-amber-900/70 dark:border-amber-800">
                <th className="py-1 pr-2 font-medium">{t("adminAi.tableItem")}</th>
                <th className="py-1 pr-2 font-medium">{t("adminAi.tableBefore")}</th>
                <th className="py-1 font-medium">{t("adminAi.tableAfter")}</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i} className="border-b border-amber-100/80 last:border-0 dark:border-amber-900/50">
                  <td className="py-1.5 pr-2 font-medium text-amber-950 dark:text-amber-50">{row.label}</td>
                  <td className="py-1.5 pr-2 text-amber-800 dark:text-amber-200">{row.before ?? "—"}</td>
                  <td className="py-1.5 font-semibold text-amber-950 dark:text-amber-50">
                    {row.after ?? row.detail ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre-wrap text-xs text-amber-900 dark:text-amber-100">{fallbackText}</pre>
        )}
      </div>

      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-amber-200/60 px-3 py-2 dark:border-amber-800">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1 text-xs text-[#6b6358] underline hover:text-[#857D71]"
            >
              <ExternalLink className="h-3 w-3" />
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-amber-200/60 bg-amber-50/50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/20">
        <Button
          size="sm"
          className="h-8 flex-1 bg-[#857D71] text-white hover:bg-[#6b6358]"
          disabled={confirming || isExpired}
          onClick={onConfirm}
        >
          {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
          {t("adminAi.confirm")}
        </Button>
        <Button size="sm" variant="outline" className="h-8 flex-1" disabled={confirming} onClick={onCancel}>
          <Ban className="mr-1 h-3.5 w-3.5" />
          {t("adminAi.cancel")}
        </Button>
      </div>
    </div>
  );
}
