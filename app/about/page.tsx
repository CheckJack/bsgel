"use client";

import { HeroSlider } from "@/components/layout/hero-slider";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";

export default function AboutPage() {
  const { t, tArray } = useLanguage();

  const slides = [
    {
      type: "video" as const,
      src: "/1204 (3.mp4",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[85dvh] min-h-[420px] sm:h-[90dvh] md:h-screen" showDarkOverlay={false} />
      <div className="min-h-screen bg-brand-white">

      {/* Mission Section */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 flex items-center">
        <div className="container mx-auto w-full">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-brand-black text-center leading-relaxed w-full px-4 sm:px-6 md:px-8">
            {t("about.mission")}
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative overflow-hidden rounded-lg bg-gray-100">
              <Image
                src="/elmien-about.jpg"
                alt={t("about.specialistAlt")}
                width={740}
                height={1024}
                className="h-full w-full object-cover"
                priority
                unoptimized
              />
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-brand-black">
                {t("about.title")}
              </h2>
              <p className="mt-4 text-base sm:text-lg font-light leading-relaxed text-brand-black whitespace-pre-line">
                {t("about.elmienStory")}
              </p>

              <div className="mt-6 space-y-3">
                <details className="group rounded-md border border-gray-200 bg-white p-4">
                  <summary className="cursor-pointer list-none text-sm sm:text-base font-medium text-brand-black">
                    {t("about.scopeTitle")}
                  </summary>
                  <p className="mt-3 text-sm sm:text-base font-light leading-relaxed text-gray-700">
                    {t("about.scopeBody")}
                  </p>
                </details>

                <details className="group rounded-md border border-gray-200 bg-white p-4">
                  <summary className="cursor-pointer list-none text-sm sm:text-base font-medium text-brand-black">
                    {t("about.qualityPolicyTitle")}
                  </summary>
                  <p className="mt-3 text-sm sm:text-base font-light leading-relaxed text-gray-700">
                    {t("about.qualityPolicyIntro")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm sm:text-base font-light leading-relaxed text-gray-700">
                    {tArray("about.qualityPolicyItems").map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Image
              src="/elmien-signature.webp"
              alt={t("about.elmienSignatureAlt")}
              width={360}
              height={120}
              className="h-auto w-[320px] sm:w-[420px] md:w-[520px]"
              unoptimized
            />
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

