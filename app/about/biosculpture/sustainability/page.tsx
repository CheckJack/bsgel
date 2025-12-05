"use client";

import { HeroSlider } from "@/components/layout/hero-slider";

export default function SustainabilityPage() {
  const slides = [
    {
      type: "image" as const,
      src: "/DSC_8219-v3.webp",
      title: "Sustainability",
      description: "Our commitment to a sustainable future",
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
            <h2 className="text-4xl font-medium mb-4 text-brand-black">Sustainability</h2>
            <div className="w-24 h-1 bg-brand-champagne mx-auto"></div>
          </div>
          <p className="text-lg font-light text-brand-black text-center leading-relaxed max-w-3xl mx-auto">
            At Biosculpture, sustainability is not just a goal—it's a fundamental part of our 
            identity. We are committed to creating products and practices that respect our planet 
            and contribute to a healthier future for generations to come.
          </p>
        </div>
      </section>

      {/* Sustainability Initiatives */}
      <section className="py-16 px-4 bg-brand-sweet-bianca">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-brand-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Eco-Friendly Products</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                We prioritize environmentally responsible ingredients and packaging solutions 
                that minimize our ecological footprint while maintaining product excellence.
              </p>
            </div>
            <div className="bg-brand-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Responsible Sourcing</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                Our supply chain is built on ethical principles, ensuring that raw materials 
                are sourced sustainably and workers throughout our supply chain are treated fairly.
              </p>
            </div>
            <div className="bg-brand-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-medium mb-4 text-brand-black">Reduced Waste</h3>
              <p className="font-light text-brand-champagne leading-relaxed">
                We continuously work to reduce waste in our manufacturing processes and packaging, 
                exploring innovative solutions that lessen our environmental impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-medium mb-4 text-brand-black">Our Commitment</h3>
          </div>
          <div className="space-y-6 font-light text-lg text-brand-black leading-relaxed">
            <p>
              Sustainability is an ongoing journey, not a destination. We are continuously 
              evaluating and improving our practices, from product formulation to packaging 
              design, always with an eye toward environmental responsibility.
            </p>
            <p>
              We believe that as industry leaders, we have a responsibility to set the standard 
              for sustainable practices in professional nail care. Our commitment extends beyond 
              our products to every aspect of our operations, and we are dedicated to transparency 
              in sharing our progress and challenges along the way.
            </p>
            <p>
              Together with our community of professionals and clients, we are building a more 
              sustainable future for the nail care industry—one that honors both the beauty we 
              create and the planet we share.
            </p>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

