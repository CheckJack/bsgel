"use client";

import { HeroSlider } from "@/components/layout/hero-slider";
import { useState, useEffect } from "react";

const productLines = [
  {
    image: "/Cuticle Oils (1).jpg",
    text: "ETHOS",
    link: "/ethos",
    textPosition: "center" as const,
    textCase: "uppercase" as const,
  },
  {
    image: "/328 Peach Pitstop - hand and product (5).jpg",
    text: "BIO SCULPTURE",
    link: "/products",
    textPosition: "bottom-left" as const,
    textCase: "uppercase" as const,
  },
  {
    image: "/123_Tracey_Wide - Copy.jpg",
    text: "EVO",
    link: "/evo",
    textPosition: "center" as const,
    textCase: "uppercase" as const,
  },
  {
    image: "/SPA - Apricot Kernel Scrub  (21) (1).jpg",
    text: "SPA",
    link: "/spa",
    textPosition: "bottom-left" as const,
    textCase: "uppercase" as const,
  },
  {
    image: "/316 A Breath of Fresh Air - Creative (3).jpg",
    text: "GEMINI",
    link: "/gemini",
    textPosition: "center" as const,
    textCase: "uppercase" as const,
  },
];


function RotatingWordsSection() {
  const words = ["HEALTHY", "QUALITY", "LONGEVITY"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out current word (1 second)
      setIsVisible(false);
      setTimeout(() => {
        // Change to next word while invisible
        setCurrentIndex((prev) => (prev + 1) % words.length);
        // Ensure it stays invisible initially
        setIsVisible(false);
        // Show blank for 2 seconds, then fade in slowly
        setTimeout(() => {
          // Fade in next word gradually (1 second transition)
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
        }, 2000);
      }, 1000);
    }, 8000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative pt-32 pb-32 px-4 min-h-[60vh] flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/dssfvszvx.mp4" type="video/mp4" />
      </video>
      <div className="relative z-10 text-center px-4">
        <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-medium text-brand-white" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
          <span className="inline-block relative min-w-[200px] sm:min-w-[300px] md:min-w-[400px] lg:min-w-[500px] xl:min-w-[600px] h-[1.2em]">
            <span
              key={currentIndex}
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out"
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 1s ease-in-out'
              }}
            >
              {words[currentIndex]}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const slides = [
    {
      type: "video" as const,
      src: "/1204 (3.mp4",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" showDarkOverlay={false} />
      <div className="min-h-screen bg-brand-white">

      {/* Mission Section */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 flex items-center">
        <div className="container mx-auto w-full">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-brand-black text-center leading-relaxed w-full px-4 sm:px-6 md:px-8">
            Concentrating solely on gel systems and nail related care since its founding in 1988. 
            Bio Sculpture has become a global powerhouse through its extensive brand portfolio. Products are 
            available for professional and consumer use. Bio Sculpture adheres to a strict channel exclusivity 
            strategy with professional products (Biogel, Evo and Bi-olygel) that are sold to certified trained 
            Bio Sculpture nail technicians. Retail products (Spa, Ethos and Gemini Nail Polish) is sold to retail 
            consumers. Bio Sculpture is sold in over 40 countries.
          </p>
        </div>
      </section>

      {/* Product Lines Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-brand-black text-left">Our Product Lines</h2>
        </div>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {productLines.map((category, index) => {
              const content = (
                <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden group cursor-pointer">
                  <img
                    src={category.image}
                    alt={category.text}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {index === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                      <img
                        src="/ETHOSLOGO.png"
                        alt="ETHOS Logo"
                        className="object-contain w-auto h-auto max-w-[200px] max-h-[200px]"
                      />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                      <img
                        src="/biologo.png"
                        alt="BIO Logo"
                        className="object-contain w-auto h-auto max-w-[200px] max-h-[200px]"
                      />
                    </div>
                  )}
                  {index === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                      <img
                        src="/EVOLOGO.png"
                        alt="EVO Logo"
                        className="object-contain w-auto h-auto max-w-[140px] max-h-[140px]"
                      />
                    </div>
                  )}
                  {index === 3 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                      <img
                        src="/SPALOGO.png"
                        alt="SPA Logo"
                        className="object-contain w-auto h-auto max-w-[120px] max-h-[120px]"
                      />
                    </div>
                  )}
                  {index === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                      <img
                        src="/geminilogo.png"
                        alt="Gemini Logo"
                        className="object-contain w-auto h-auto max-w-[195px] max-h-[195px]"
                      />
                    </div>
                  )}
                </div>
              );

              return category.link ? (
                <a key={index} href={category.link}>
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bespoke Path Section */}
      <section className="pt-12 sm:pt-16 pb-20 sm:pb-32 px-4 sm:px-6">
        <div className="container mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center px-4 sm:px-6 md:px-8">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4 sm:mb-6 text-brand-black">THE BESPOKE PATH TO HEALTHY NAILS</h2>
              <p className="text-base sm:text-lg font-light text-brand-black leading-relaxed">
                As the bespoke path to nail perfection, we are dedicated to providing nail technicians with a premium system and quality education. Through our comprehensive training programs, nail techs are equipped with the knowledge to analyse each client's unique nail type and condition, delivering prescriptive treatments that promote optimal nail health. We go beyond traditional overlays by offering techniques that create long lasting results, customised to suit the client's lifestyle. With our range of base gels, colours, top coats, and builder gels, nail techs can achieve improved natural nail condition and extended lifespan of their work.
              </p>
            </div>
            <div className="relative">
              <img 
                src="/Training_1.webp" 
                alt="Bio Sculpture training" 
                className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rotating Words Section */}
      <RotatingWordsSection />

      {/* Story Section */}
      <section className="pt-20 sm:pt-32 pb-20 sm:pb-32 px-4 sm:px-6">
        <div className="container mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center px-4 sm:px-6 md:px-8">
            <div className="relative order-2 md:order-1">
              <img 
                src="/306_Sunset_Red_Hands.jpg" 
                alt="Bio Sculpture story" 
                className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-lg object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-4 sm:mb-6 text-brand-black uppercase">OUR STORY</h2>
              <div className="space-y-4 sm:space-y-6 font-light text-base sm:text-lg text-brand-black leading-relaxed">
                <p>
                  Bio Sculpture has been a trusted name in professional nail care for years, 
                  building a reputation for quality, innovation, and commitment to healthy nail practices. 
                  Our journey began with a simple belief: that beautiful nails and healthy nails are not 
                  mutually exclusive.
                </p>
                <p>
                  Today, we continue to lead the industry with our range of premium products, 
                  including Bio Sculpture, Biogel, Evo, Bi-olygel, Ethos, Gemini, and Spa. Each brand 
                  in our portfolio is carefully crafted to meet the diverse needs of nail professionals 
                  and their clients.
                </p>
                <p>
                  Our comprehensive training programs empower nail technicians with the knowledge and 
                  skills needed to excel in their craft, while our commitment to ethical practices 
                  ensures that every product we create aligns with our values of health, sustainability, 
                  and professionalism.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 w-full min-h-[300px] sm:min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/123_Tracey_Wide - Copy.jpg" 
            alt="Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10 px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-3 sm:mb-4 text-brand-white">Get in Touch</h2>
          <p className="text-base sm:text-lg font-light text-brand-white mb-6 sm:mb-8">
            Have questions or want to learn more about our products and training programs?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="/salons"
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-brand-black text-brand-white border-2 border-brand-black hover:bg-brand-white hover:text-brand-black transition-colors font-medium rounded text-sm sm:text-base"
            >
              Find a Salon
            </a>
            <a
              href="/products"
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-brand-white text-brand-black border-2 border-brand-black hover:bg-brand-black hover:text-brand-white hover:border-brand-black transition-colors font-medium rounded text-sm sm:text-base"
            >
              Explore Products
            </a>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

