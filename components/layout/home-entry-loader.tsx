"use client";

import { useEffect } from "react";
import Image from "next/image";

interface HomeEntryLoaderProps {
  onComplete: () => void;
  durationMs?: number;
}

export function HomeEntryLoader({ onComplete, durationMs = 1800 }: HomeEntryLoaderProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="Bio Sculpture"
          width={320}
          height={34}
          className="h-8 w-auto sm:h-10 md:h-12"
          priority
          unoptimized
        />

        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-loaderPulse rounded-full bg-[#d2b48c] [animation-delay:0ms]" />
          <span className="h-3 w-3 animate-loaderPulse rounded-full bg-[#f1d4aa] [animation-delay:200ms]" />
          <span className="h-3 w-3 animate-loaderPulse rounded-full bg-[#b98a5d] [animation-delay:400ms]" />
          <span className="h-3 w-3 animate-loaderPulse rounded-full bg-[#9d7651] [animation-delay:600ms]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loaderPulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        .animate-loaderPulse {
          animation: loaderPulse 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
