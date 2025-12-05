"use client";

import Image from "next/image";

export function AsSeenIn() {
  const logos = [
    { src: "/vogue.avif", alt: "Vogue" },
    { src: "/Sheerluxe.avif", alt: "Sheerluxe" },
    { src: "/the-times.webp", alt: "The Times" },
    { src: "/Stylist.avif", alt: "Stylist" },
    { src: "/telegraph.avif", alt: "The Telegraph" },
    { src: "/Red_black_logo_300_px.avif", alt: "Red" },
  ];

  return (
    <section className="w-full bg-white py-8 sm:py-12 md:py-16">
      <div className="w-full px-4 sm:px-6 md:px-8">
        {/* AS SEEN IN Title - Centered */}
        <h2 className="text-center text-sm sm:text-base md:text-lg font-medium text-black uppercase tracking-wide mb-6 sm:mb-8 md:mb-12">
          AS SEEN IN
        </h2>

        {/* Logos Row - Horizontal, Evenly Spaced */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-8 sm:h-10 md:h-14 lg:h-16 w-auto"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={150}
                height={80}
                className="h-full w-auto object-contain max-w-[100px] sm:max-w-[120px] md:max-w-[150px]"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

