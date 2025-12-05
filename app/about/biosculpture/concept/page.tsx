"use client";

import { HeroSlider } from "@/components/layout/hero-slider";

export default function ConceptPage() {
  const slides = [
    {
      type: "image" as const,
      src: "/306_Sunset_Red_Hands.jpg",
      title: "Concept",
      description: "The philosophy behind Biosculpture",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[60vh]" />
      <div className="min-h-screen bg-brand-white">

      {/* Main Content Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-medium mb-4 text-brand-black">Concept</h2>
            <div className="w-24 h-1 bg-brand-champagne mx-auto"></div>
          </div>
          <p className="text-lg font-light text-brand-black text-center leading-relaxed max-w-3xl mx-auto">
            The Biosculpture concept is built on a foundation of health, quality, and artistry. 
            We envision a world where beautiful nails and healthy nails are one and the same, 
            achieved through innovative products and professional expertise.
          </p>
        </div>
      </section>

      {/* Concept Details */}
      <section className="py-16 px-4 bg-brand-sweet-bianca">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Our Vision</h3>
              <p className="font-light text-brand-champagne leading-relaxed mb-4">
                To be the leading provider of professional nail care solutions that prioritize 
                natural nail health without compromising on aesthetic excellence.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Our Mission</h3>
              <p className="font-light text-brand-champagne leading-relaxed mb-4">
                To empower nail professionals with superior products, comprehensive training, 
                and ongoing support, enabling them to deliver exceptional results for their clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-medium mb-4 text-brand-black">Our Philosophy</h3>
          </div>
          <div className="space-y-6 font-light text-lg text-brand-black leading-relaxed">
            <p>
              At the heart of Biosculpture lies a simple yet powerful philosophy: beauty and health 
              should never be mutually exclusive. Every product we create, every training program we 
              develop, and every relationship we build is guided by this principle.
            </p>
            <p>
              We believe that professional nail care is an art form that requires both technical 
              skill and creative vision. Our concept integrates cutting-edge technology with time-honored 
              techniques, ensuring that every application is both safe and stunning.
            </p>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

