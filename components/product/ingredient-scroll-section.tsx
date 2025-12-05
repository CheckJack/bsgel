"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Ingredient {
  id: string;
  name: string;
  image: string;
  whyWeUseIt: string;
  benefits: string[];
  backgroundColor?: string;
  textColor?: string;
  imageSize?: string;
}

interface IngredientScrollSectionProps {
  ingredients: Ingredient[];
}

export function IngredientScrollSection({ ingredients }: IngredientScrollSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = sectionRefs.current.findIndex(ref => ref === entry.target);
          if (index !== -1) {
            setActiveIndex(index);
          }
        }
      });
    }, observerOptions);

    sectionRefs.current.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      sectionRefs.current.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, [ingredients]);

  if (!ingredients || ingredients.length === 0) return null;

  return (
    <>
      {ingredients.map((ingredient, index) => {
        const backgroundColor = ingredient.backgroundColor || "#FFFFFF";
        const textColor = ingredient.textColor || "#000000";
        const isDarkBackground = backgroundColor !== "#FFFFFF";
        const imageSize = ingredient.imageSize || "85%";
        const isActive = activeIndex === index;

        return (
          <section
            key={ingredient.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            className="relative w-full h-screen flex items-center transition-colors duration-700 ease-in-out snap-start snap-always"
            style={{
              backgroundColor,
            }}
          >
            <div className="container mx-auto px-4 max-w-7xl h-full w-full">
              <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center h-full py-8 md:py-12">
                {/* Left Container - Ingredient Image */}
                <div className="relative w-full h-full flex items-center justify-center min-h-0">
                  <div 
                    className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-out ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
                    }`}
                    style={{ maxWidth: imageSize, maxHeight: '90%' }}
                  >
                    <div className="relative w-full h-full max-w-full max-h-full">
                      <Image
                        src={ingredient.image}
                        alt={ingredient.name}
                        fill
                        className="object-contain transition-all duration-700 ease-out"
                        unoptimized
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Container - Ingredient Information */}
                <div 
                  className={`space-y-6 h-full flex flex-col justify-center transition-all duration-700 ease-out ${
                    isActive ? 'opacity-100 translate-x-0' : 'opacity-70 translate-x-4'
                  }`}
                  style={{ color: textColor }}
                >
                  <div className="overflow-hidden">
                    <h3 
                      className="text-3xl md:text-4xl lg:text-5xl font-medium mb-4"
                      style={{ color: textColor }}
                    >
                      {ingredient.name}
                    </h3>
                  </div>

                  {/* Why We Use It */}
                  {ingredient.whyWeUseIt && (
                    <div className="overflow-hidden">
                      <div className="transform transition-all duration-700">
                        <h4 className="text-xl md:text-2xl font-medium mb-3" style={{ color: textColor }}>
                          Why We Use It
                        </h4>
                        <p className="text-base md:text-lg leading-relaxed" style={{ color: textColor }}>
                          {ingredient.whyWeUseIt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {ingredient.benefits && ingredient.benefits.length > 0 && (
                    <div className="overflow-hidden">
                      <div className="transform transition-all duration-700">
                        <h4 className="text-xl md:text-2xl font-medium mb-3" style={{ color: textColor }}>
                          Benefits
                        </h4>
                        <ul className="space-y-2">
                          {ingredient.benefits.map((benefit, benefitIndex) => (
                            <li 
                              key={benefitIndex} 
                              className="text-base md:text-lg flex items-start"
                              style={{ color: textColor }}
                            >
                              <span className="mr-3" style={{ color: isDarkBackground ? textColor : "#857D71" }}>•</span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

