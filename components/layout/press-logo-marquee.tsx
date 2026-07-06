"use client";

import { cn } from "@/lib/utils";

const PRESS_LOGOS = [
  { src: "/press-logos/elle.png", alt: "Elle", width: 63, height: 26 },
  { src: "/press-logos/byrdie.png", alt: "Byrdie", width: 172, height: 25 },
  {
    src: "/press-logos/seventeen.png",
    alt: "Seventeen",
    width: 120,
    height: 29,
  },
  { src: "/press-logos/bustle.png", alt: "Bustle", width: 94, height: 25 },
  { src: "/press-logos/ps.png", alt: "PS", width: 44, height: 26 },
  {
    src: "/press-logos/cosmopolitan.png",
    alt: "Cosmopolitan",
    width: 142,
    height: 25,
  },
] as const;
const MARQUEE_REPEAT_COUNT = 8;

export function PressLogoMarquee({
  className,
  variant = "pink",
}: {
  className?: string;
  variant?: "black" | "pink" | "champagne" | "light";
}) {
  const sequence = Array.from(
    { length: MARQUEE_REPEAT_COUNT * PRESS_LOGOS.length },
    (_, index) => PRESS_LOGOS[index % PRESS_LOGOS.length]
  );
  const track = [...sequence, ...sequence];
  const invertLogos = variant === "champagne";

  const backgroundClass =
    variant === "black"
      ? "bg-brand-black"
      : variant === "pink"
        ? "bg-pink-900"
        : variant === "champagne"
          ? "bg-brand-champagne"
          : "bg-brand-white";

  return (
    <div
      className={cn("relative w-full shrink-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className={cn(
          backgroundClass,
          "flex h-16 items-center overflow-hidden sm:h-16 md:h-[4.5rem]"
        )}
      >
        <div className="flex h-full w-max animate-marqueeScroll items-center gap-10 px-5 sm:gap-14 sm:px-8 md:gap-16 [&_img]:block [&_img]:max-h-full [&_img]:w-auto [&_img]:shrink-0">
          {track.map((logo, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${logo.alt}-${index}`}
              src={logo.src}
              alt=""
              width={logo.width}
              height={logo.height}
              loading="lazy"
              decoding="async"
              className={cn(
                "h-5 w-auto object-contain object-center sm:h-6 md:h-7",
                invertLogos && "brightness-0 invert"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
