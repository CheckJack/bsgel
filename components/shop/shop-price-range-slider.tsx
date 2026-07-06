"use client";

import { cn } from "@/lib/utils";

type ShopPriceRangeSliderProps = {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  floor?: number;
  ceiling?: number;
  step?: number;
  className?: string;
};

export function ShopPriceRangeSlider({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  floor = 0,
  ceiling = 150,
  step = 1,
  className,
}: ShopPriceRangeSliderProps) {
  const minVal = minPrice !== "" ? Math.min(parseFloat(minPrice) || floor, ceiling) : floor;
  const maxVal = maxPrice !== "" ? Math.max(parseFloat(maxPrice) || ceiling, floor) : ceiling;
  const range = ceiling - floor || 1;
  const minPercent = ((minVal - floor) / range) * 100;
  const maxPercent = ((maxVal - floor) / range) * 100;

  const handleMinChange = (value: number) => {
    const next = Math.min(Math.max(value, floor), maxVal);
    onMinPriceChange(next <= floor ? "" : String(next));
  };

  const handleMaxChange = (value: number) => {
    const next = Math.max(Math.min(value, ceiling), minVal);
    onMaxPriceChange(next >= ceiling ? "" : String(next));
  };

  return (
    <div className={cn("shop-price-range-slider space-y-4 pt-1", className)}>
      <div className="flex items-center justify-between text-sm font-light text-brand-black">
        <span>€{minVal.toFixed(0)}</span>
        <span className="text-brand-champagne/70">—</span>
        <span>€{maxVal.toFixed(0)}</span>
      </div>

      <div className="relative mx-1 h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-champagne/15" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-champagne"
          style={{ left: `${minPercent}%`, width: `${Math.max(maxPercent - minPercent, 0)}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={minVal}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          aria-label="Minimum price"
          className="absolute inset-0 z-20 h-full w-full"
          style={{ zIndex: minVal > ceiling - step * 3 ? 40 : 20 }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={maxVal}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          aria-label="Maximum price"
          className="absolute inset-0 z-30 h-full w-full"
        />
      </div>

      <div className="flex justify-between text-xs font-light text-brand-champagne/70">
        <span>€{floor}</span>
        <span>€{ceiling}+</span>
      </div>
    </div>
  );
}
