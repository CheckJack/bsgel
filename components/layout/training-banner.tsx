"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function TrainingBanner() {
  return (
    <section className="w-full mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch">
        {/* Left Column - Image and Text Section */}
        <div className="flex flex-col">
          {/* Left Image */}
          <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
            <div className="relative w-full h-full">
              <Image
                src="/Training_1.webp"
                alt="Training Session"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          {/* Text Section Below Left Image */}
          <div className="bg-white p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-wide uppercase mb-3 sm:mb-4 text-black">
              TRAIN WITH US
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-black mb-4 sm:mb-6">
              Advance your beauty career with RE:NEW. We offer world class online and in-person training across 8 locations in the UK & Ireland
            </p>
            <Link href="/training">
              <Button className="bg-black text-white hover:bg-black/90 uppercase tracking-wide px-4 sm:px-6 py-2 text-sm sm:text-base w-full sm:w-auto">
                SHOP COURSES & KITS
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column - Vertical Image (should match left column height) */}
        <div className="relative w-full h-[400px] sm:h-[500px] md:h-[700px] lg:h-full overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/DSC_8219-v3.webp"
              alt="Training Detail"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
