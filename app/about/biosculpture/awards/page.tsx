"use client";

import { HeroSlider } from "@/components/layout/hero-slider";

export default function AwardsPage() {
  const slides = [
    {
      type: "image" as const,
      src: "/306_Sunset_Red_Hands.jpg",
      title: "Awards",
      description: "Recognizing excellence in nail care",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" />
      <div className="min-h-screen bg-brand-white">

      {/* Main Content Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-medium mb-4 text-brand-black">Awards</h2>
            <div className="w-24 h-1 bg-brand-champagne mx-auto"></div>
          </div>
          <p className="text-lg font-light text-brand-black text-center leading-relaxed max-w-3xl mx-auto">
            Biosculpture has been honored with numerous awards and recognitions throughout the years, 
            celebrating our commitment to excellence, innovation, and quality in professional nail care.
          </p>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 px-4 bg-brand-sweet-bianca">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-brand-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Industry Recognition</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                Our dedication to innovation and quality has earned us recognition from industry leaders 
                and professional organizations worldwide. These accolades reflect our ongoing commitment 
                to excellence.
              </p>
            </div>
            <div className="bg-brand-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Product Excellence</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                Our product range has been celebrated for its superior quality, innovative formulations, 
                and dedication to natural nail health. These awards acknowledge our commitment to creating 
                products that professionals trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievement Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-medium mb-4 text-brand-black">Our Achievements</h3>
          </div>
          <div className="space-y-6 font-light text-lg text-brand-black leading-relaxed">
            <p>
              Over the years, Biosculpture has been honored with prestigious awards that recognize our 
              innovation, quality, and contribution to the professional nail care industry. These 
              achievements motivate us to continue pushing boundaries and setting new standards.
            </p>
            <p>
              While awards and recognition are meaningful, our greatest achievement remains the trust 
              and satisfaction of the nail professionals and clients who choose Biosculpture. Their 
              continued support drives us to maintain the highest standards in everything we do.
            </p>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

