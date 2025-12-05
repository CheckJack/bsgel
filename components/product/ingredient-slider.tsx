"use client";

import { useState, useEffect, useRef } from "react";
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

interface IngredientSliderProps {
  ingredients: Ingredient[];
}

export function IngredientSlider({ ingredients }: IngredientSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
  const [key, setKey] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const lockedScrollY = useRef(0);
  const lastWheelTime = useRef(0);
  const isLockedRef = useRef(false);
  const unlockTimeRef = useRef(0);
  const scrollLockStylesRef = useRef<{
    html: { overflow: string };
    body: { overflow: string; position: string; width: string; top: string; paddingRight: string };
    navbar: { position: string; top: string; zIndex: string; width: string } | null;
    scrollY: number;
  } | null>(null);

  // Function to immediately unlock and restore scroll
  const unlockScroll = () => {
    if (!scrollLockStylesRef.current) return;
    
    const { html, body, navbar, scrollY } = scrollLockStylesRef.current;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    
    // Get the current visual scroll position (when body is fixed, it's stored in top)
    const bodyTop = bodyEl.style.top;
    const visualScrollY = bodyTop ? Math.abs(parseInt(bodyTop)) : scrollY;
    
    // Restore scroll immediately
    htmlEl.style.overflow = html.overflow;
    bodyEl.style.overflow = body.overflow;
    bodyEl.style.position = body.position;
    bodyEl.style.width = body.width;
    bodyEl.style.top = body.top;
    bodyEl.style.paddingRight = body.paddingRight;
    
    // Restore navbar
    if (navbar) {
      const navbarElement = document.querySelector('nav') as HTMLElement;
      if (navbarElement) {
        navbarElement.style.position = navbar.position;
        navbarElement.style.top = navbar.top;
        navbarElement.style.zIndex = navbar.zIndex;
        navbarElement.style.width = navbar.width;
      }
    }
    
    scrollLockStylesRef.current = null;
    
    // Restore scroll position to maintain visual position
    requestAnimationFrame(() => {
      window.scrollTo(0, visualScrollY);
    });
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Detect when slider section enters viewport and lock scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const checkScrollLock = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
      
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;
      const currentScrollY = window.scrollY;
      const timeSinceUnlock = Date.now() - unlockTimeRef.current;
      
      // Lock when section reaches 100% viewport (accounting for header)
      // Section should be locked when its top aligns with navbar (navbarHeight)
      // Using a small tolerance range for reliability
      const shouldLock = sectionTop <= navbarHeight + 20 && sectionTop >= navbarHeight - 20 && sectionBottom >= windowHeight * 0.4;
      const canLock = timeSinceUnlock > 500; // Small cooldown to prevent flickering
      
      if (shouldLock && !isLockedRef.current && canLock) {
        // Lock immediately when section reaches 100% viewport
        const scrollY = window.scrollY;
        lockedScrollY.current = scrollY;
        isLockedRef.current = true;
        setIsLocked(true);
      }
      
      // Don't unlock via scroll detection - only unlock at edges via wheel events
      // This ensures user must go through all sliders when scrolling in either direction
    };

    // Check immediately on scroll (no delay)
    const handleScroll = () => {
      checkScrollLock();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Use intersection observer for additional reliability
    const observer = new IntersectionObserver(
      () => {
        requestAnimationFrame(checkScrollLock);
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
        rootMargin: '0px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Initial check
    checkScrollLock();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isLocked, currentIndex, ingredients.length]);

  // Lock scroll position when section is locked
  useEffect(() => {
    if (isLocked) {
      // Prevent body scroll while keeping navbar visible
      const scrollY = window.scrollY;
      lockedScrollY.current = scrollY;
      
      const html = document.documentElement;
      const body = document.body;
      
      const originalHtmlOverflow = html.style.overflow;
      const originalBodyOverflow = body.style.overflow;
      const originalBodyPosition = body.style.position;
      const originalBodyWidth = body.style.width;
      const originalBodyTop = body.style.top;
      const originalBodyPaddingRight = body.style.paddingRight;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.width = '100%';
      body.style.top = `-${scrollY}px`;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Keep navbar visible by explicitly making it fixed
      let navbarStyles: { position: string; top: string; zIndex: string; width: string } | null = null;
      
      const navbarElement = document.querySelector('nav') as HTMLElement;
      if (navbarElement) {
        navbarStyles = {
          position: navbarElement.style.position,
          top: navbarElement.style.top,
          zIndex: navbarElement.style.zIndex,
          width: navbarElement.style.width,
        };
        
        navbarElement.style.position = 'fixed';
        navbarElement.style.top = '0';
        navbarElement.style.zIndex = '9999';
        navbarElement.style.width = '100%';
      }

      // Store styles for immediate unlock
      scrollLockStylesRef.current = {
        html: { overflow: originalHtmlOverflow },
        body: {
          overflow: originalBodyOverflow,
          position: originalBodyPosition,
          width: originalBodyWidth,
          top: originalBodyTop,
          paddingRight: originalBodyPaddingRight,
        },
        navbar: navbarStyles,
        scrollY,
      };

      return () => {
        unlockScroll();
      };
    }
  }, [isLocked]);

  // Handle wheel events to change ingredients when section is in viewport
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
      const timeSinceUnlock = Date.now() - unlockTimeRef.current;
      const deltaY = e.deltaY;

      // Lock immediately if section reaches 100% viewport (accounting for header)
      const sectionAtTop = rect.top <= navbarHeight + 20 && rect.top >= navbarHeight - 20;
      
      if (!isLockedRef.current && sectionAtTop && rect.bottom >= window.innerHeight * 0.4 && timeSinceUnlock > 500) {
        e.preventDefault(); // Prevent scroll to lock the section
        const scrollY = window.scrollY;
        lockedScrollY.current = scrollY;
        isLockedRef.current = true;
        setIsLocked(true);
        return; // Lock established, next wheel event will handle ingredient change
      }

      // Only handle wheel events when section is locked
      if (!isLockedRef.current) return;
      
      // When locked, always handle wheel events to go through ingredients
      // Only unlock at edges (first ingredient scrolling up, last ingredient scrolling down)

      const threshold = 30;
      
      // Check if we're at the edges FIRST, before preventing default
      const isAtLast = currentIndex === ingredients.length - 1;
      const isAtFirst = currentIndex === 0;
      const scrollingDown = deltaY > 0;
      const scrollingUp = deltaY < 0;

      // If at edge and trying to scroll past, unlock and allow scroll
      if (Math.abs(deltaY) > threshold && ((isAtLast && scrollingDown) || (isAtFirst && scrollingUp))) {
        // Unlock immediately and restore scroll synchronously
        if (isLockedRef.current) {
          isLockedRef.current = false;
          unlockTimeRef.current = Date.now(); // Record unlock time to prevent immediate re-lock
          unlockScroll();
          setIsLocked(false);
        }
        // Don't prevent default - allow scroll to happen naturally
        // Clear any pending scroll locks
        return;
      }
      

      // If animating, prevent scroll
      if (isAnimating) {
        e.preventDefault();
        return;
      }

      const now = Date.now();
      const timeSinceLastWheel = now - lastWheelTime.current;
      
      // Throttle wheel events
      if (timeSinceLastWheel < 800) {
        e.preventDefault();
        return;
      }

      if (Math.abs(deltaY) > threshold) {
        lastWheelTime.current = now;

        // Otherwise, prevent scroll and change ingredient
        e.preventDefault();

        if (scrollingDown) {
          // Go to next ingredient
          setAnimationDirection('right');
          setIsAnimating(true);
          setCurrentIndex((prev) => prev + 1);
          setKey((prev) => prev + 1);
        } else {
          // Go to previous ingredient
          setAnimationDirection('left');
          setIsAnimating(true);
          setCurrentIndex((prev) => prev - 1);
          setKey((prev) => prev + 1);
        }
      } else {
        // Below threshold - prevent scroll when locked
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isLocked, isAnimating, currentIndex, ingredients.length, unlockScroll]);

  if (!ingredients || ingredients.length === 0) return null;

  const currentIngredient = ingredients[currentIndex];
  const backgroundColor = currentIngredient.backgroundColor || "#FFFFFF";
  const textColor = currentIngredient.textColor || "#000000";
  const isDarkBackground = backgroundColor !== "#FFFFFF";
  const imageSize = currentIngredient.imageSize || "85%";

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden transition-colors duration-700 ease-in-out" 
      style={{ backgroundColor }}
    >
      {/* Main Slider Container */}
      <div className="relative w-full h-full">
        {/* Slide Content */}
        <div className="w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-7xl h-full">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center h-full py-8 md:py-12">
              {/* Left Container - Ingredient Image */}
              <div className="relative w-full h-full flex items-center justify-center min-h-0 overflow-hidden">
                <div 
                  key={`image-${key}`}
                  className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-out ${
                    isAnimating 
                      ? animationDirection === 'right'
                        ? 'animate-slide-in-right'
                        : 'animate-slide-in-left'
                      : ''
                  }`}
                  style={{ maxWidth: imageSize, maxHeight: '90%', width: '100%', height: '100%' }}
                >
                  <div className="relative w-full h-full" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                    <Image
                      src={currentIngredient.image}
                      alt={currentIngredient.name}
                      fill
                      className="object-contain transition-all duration-700 ease-out"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Container - Ingredient Information */}
              <div 
                key={`content-${key}`}
                className={`space-y-6 h-full flex flex-col justify-center transition-all duration-700 ease-out ${
                  isAnimating
                    ? animationDirection === 'right'
                      ? 'animate-fade-slide-in-right'
                      : 'animate-fade-slide-in-left'
                    : ''
                }`}
                style={{ color: textColor }}
              >
                <div className="overflow-hidden">
                  <h3 
                    className="text-3xl md:text-4xl lg:text-5xl font-medium mb-4"
                    style={{ color: textColor }}
                  >
                    {currentIngredient.name}
                  </h3>
                </div>

                {/* Why We Use It */}
                {currentIngredient.whyWeUseIt && (
                  <div className="overflow-hidden">
                    <div 
                      className="transform transition-all duration-700 delay-100"
                      style={{ 
                        animation: isAnimating ? 'fadeInUp 0.7s ease-out 0.2s both' : 'none'
                      }}
                    >
                      <h4 className="text-xl md:text-2xl font-medium mb-3" style={{ color: textColor }}>
                        Why We Use It
                      </h4>
                      <p className="text-base md:text-lg leading-relaxed" style={{ color: textColor }}>
                        {currentIngredient.whyWeUseIt}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {currentIngredient.benefits && currentIngredient.benefits.length > 0 && (
                  <div className="overflow-hidden">
                    <div 
                      className="transform transition-all duration-700 delay-200"
                      style={{ 
                        animation: isAnimating ? 'fadeInUp 0.7s ease-out 0.3s both' : 'none'
                      }}
                    >
                      <h4 className="text-xl md:text-2xl font-medium mb-3" style={{ color: textColor }}>
                        Benefits
                      </h4>
                      <ul className="space-y-2">
                        {currentIngredient.benefits.map((benefit, index) => (
                          <li 
                            key={index} 
                            className="text-base md:text-lg flex items-start"
                            style={{ 
                              color: textColor,
                              animation: isAnimating ? `fadeInUp 0.5s ease-out ${0.4 + index * 0.1}s both` : 'none'
                            }}
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
        </div>


      </div>
    </section>
  );
}

