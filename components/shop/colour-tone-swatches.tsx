"use client";

import { useState } from "react";
import { COLOUR_TONES } from "@/lib/colour-tones";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

type ColourToneSwatchesProps = {
  selectedTone: string;
  onToneChange: (toneId: string) => void;
  /** When false, omit the name label under the swatches (default true). */
  showPreviewLabel?: boolean;
};

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0.5L14.2 9.1L22.5 12L14.2 14.9L12 23.5L9.8 14.9L1.5 12L9.8 9.1L12 0.5Z" />
    </svg>
  );
}

function SwatchSparkles() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-md" aria-hidden>
      <span className="colour-swatch-shimmer absolute inset-0 rounded-md" />
      <SparkleIcon className="colour-swatch-sparkle absolute left-0.5 top-0.5 h-2 w-2 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]" />
      <SparkleIcon className="colour-swatch-sparkle colour-swatch-sparkle-delay-1 absolute right-0.5 top-1.5 h-2.5 w-2.5 text-white/95 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
      <SparkleIcon className="colour-swatch-sparkle colour-swatch-sparkle-delay-2 absolute bottom-0.5 left-2 h-1.5 w-1.5 text-yellow-100 drop-shadow-[0_0_2px_rgba(255,255,200,0.9)]" />
      <SparkleIcon className="colour-swatch-sparkle colour-swatch-sparkle-delay-3 absolute bottom-1.5 right-1 h-2 w-2 text-white/85" />
    </span>
  );
}

function toneLabel(
  toneId: string,
  t: (key: string) => string
): string {
  if (toneId === "all") return t("productPages.colours.allTones");
  const tone = COLOUR_TONES.find((item) => item.id === toneId);
  return tone ? t(tone.labelKey) : t("productPages.colours.allTones");
}

export function ColourToneSwatches({
  selectedTone,
  onToneChange,
  showPreviewLabel = true,
}: ColourToneSwatchesProps) {
  const { t } = useLanguage();
  const [previewTone, setPreviewTone] = useState<string | null>(null);

  const activePreview = previewTone ?? selectedTone;
  const previewLabel = toneLabel(activePreview, t);

  const clearPreview = () => setPreviewTone(null);

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={t("shop.colourTone")}
        className="flex flex-wrap gap-2 pt-1"
        onMouseLeave={clearPreview}
      >
        <button
          type="button"
          role="radio"
          aria-checked={selectedTone === "all"}
          aria-label={t("productPages.colours.allTones")}
          title={t("productPages.colours.allTones")}
          onClick={() => onToneChange("all")}
          onMouseEnter={() => setPreviewTone("all")}
          onFocus={() => setPreviewTone("all")}
          onBlur={clearPreview}
          className={cn(
            "h-9 w-9 shrink-0 rounded-md border border-brand-champagne/25 shadow-sm transition-shadow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne focus-visible:ring-offset-2",
            selectedTone === "all" && "ring-2 ring-brand-black ring-offset-2"
          )}
          style={{
            background:
              "conic-gradient(from 0deg, #8B1E1E, #E87A2E, #FF3CAC, #CCFF00, #2E6B8A, #D4568A, #E8D5C4, #8B1E1E)",
          }}
        />
        {COLOUR_TONES.map((tone) => {
          const label = t(tone.labelKey);
          return (
            <button
              key={tone.id}
              type="button"
              role="radio"
              aria-checked={selectedTone === tone.id}
              aria-label={label}
              title={label}
              onClick={() => onToneChange(tone.id)}
              onMouseEnter={() => setPreviewTone(tone.id)}
              onFocus={() => setPreviewTone(tone.id)}
              onBlur={clearPreview}
              className={cn(
                "relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-black/10 shadow-sm transition-shadow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-champagne focus-visible:ring-offset-2",
                selectedTone === tone.id && "ring-2 ring-brand-black ring-offset-2"
              )}
              style={{ backgroundColor: tone.swatch }}
            >
              {tone.sparkle && <SwatchSparkles />}
            </button>
          );
        })}
      </div>

      {showPreviewLabel && (
        <p
          className={cn(
            "min-h-[1rem] text-xs font-light text-brand-black/55 transition-opacity",
            previewTone && previewTone !== selectedTone && "text-brand-black/80"
          )}
          aria-live="polite"
        >
          {previewLabel}
        </p>
      )}
    </div>
  );
}
