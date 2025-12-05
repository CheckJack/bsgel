"use client";

import { HeroSlider } from "@/components/layout/hero-slider";

export default function BiosculpturePage() {
  const slides = [
    {
      type: "image" as const,
      src: "/DSC_8219-v3.webp",
      title: "Biosculpture",
      description: "Discover the art and science of Biosculpture",
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
            <h2 className="text-4xl font-medium mb-4 text-brand-black">Biosculpture</h2>
            <div className="w-24 h-1 bg-brand-champagne mx-auto"></div>
          </div>
          <p className="text-lg font-light text-brand-black text-center leading-relaxed max-w-3xl mx-auto">
            Biosculpture represents the pinnacle of professional nail care innovation. 
            Combining artistry with advanced technology, we create products that enhance 
            natural beauty while maintaining the health and integrity of your nails.
          </p>
        </div>
      </section>

      {/* Additional Content */}
      <section className="py-16 px-4 bg-brand-sweet-bianca">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Our Approach</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                At Biosculpture, we believe in the perfect balance between beauty and health. 
                Our products are designed with the professional nail technician in mind, 
                providing tools that deliver stunning results while protecting natural nail health.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Innovation</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                Through continuous research and development, we stay at the forefront of 
                nail care technology. Our commitment to innovation ensures that our products 
                meet the evolving needs of both professionals and their clients.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

