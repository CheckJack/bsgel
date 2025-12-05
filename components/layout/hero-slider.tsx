"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Slide {
  type: "video" | "image";
  src: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  overlayImage?: string;
}

interface HeroSliderProps {
  slides: Slide[];
  autoPlayInterval?: number;
  className?: string;
  showDarkOverlay?: boolean;
  scrollControlled?: boolean;
}

export function HeroSlider({ slides, autoPlayInterval = 5000, className, showDarkOverlay = true, scrollControlled = false }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length, autoPlayInterval]);

  // Scroll-controlled video playback with scroll hijacking
  useEffect(() => {
    if (!scrollControlled || !videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;
    let accumulatedScroll = 0; // Track total scroll delta
    let isVideoComplete = false;
    const scrollSensitivity = 500; // Pixels of scroll needed to complete video (higher = slower)

    // Start video paused
    video.pause();

    const handleWheel = (e: WheelEvent) => {
      // Only hijack scroll when at top of page (within 5px tolerance)
      const isAtTop = window.scrollY <= 5;
      const scrollDelta = e.deltaY;
      
      if (isAtTop && !isVideoComplete) {
        // Prevent default scrolling - hijack the scroll
        e.preventDefault();
        e.stopPropagation();
        
        if (!video.duration) return;
        
        // Accumulate scroll delta (positive = down, negative = up)
        accumulatedScroll += scrollDelta;
        accumulatedScroll = Math.max(0, Math.min(scrollSensitivity, accumulatedScroll));
        
        // Calculate video progress (0 to 1)
        const videoProgress = accumulatedScroll / scrollSensitivity;
        
        // Update video time
        video.currentTime = videoProgress * video.duration;
        
        // Check if video reached the end
        if (videoProgress >= 0.99) {
          isVideoComplete = true;
          video.currentTime = video.duration;
          accumulatedScroll = scrollSensitivity;
        }
      } else if (isAtTop && isVideoComplete) {
        if (scrollDelta < 0) {
          // Video complete but user scrolling up - rewind video
          e.preventDefault();
          e.stopPropagation();
          
          if (!video.duration) return;
          
          accumulatedScroll += scrollDelta;
          accumulatedScroll = Math.max(0, Math.min(scrollSensitivity, accumulatedScroll));
          
          const videoProgress = accumulatedScroll / scrollSensitivity;
          video.currentTime = videoProgress * video.duration;
          
          // If rewound past end, video is no longer complete
          if (videoProgress < 0.99) {
            isVideoComplete = false;
          }
        }
        // If scrolling down and video complete, allow normal scroll (don't prevent)
      }
    };

    video.addEventListener("loadedmetadata", () => {
      // Video metadata loaded, ensure it's paused
      video.pause();
    });

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [scrollControlled]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (slides.length === 0) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${className || "h-[60vh] md:h-[80vh] lg:h-screen"} overflow-hidden group`}
    >
      {/* Slide Content */}
      <div className="absolute inset-0 w-full h-full">
        {currentSlideData.type === "video" ? (
          <video
            ref={videoRef}
            key={currentSlide}
            autoPlay={!scrollControlled}
            loop={!scrollControlled}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={currentSlideData.src} type="video/mp4" />
          </video>
        ) : (
          <div className="relative w-full h-full">
            <Image
              key={currentSlide}
              src={currentSlideData.src}
              alt={currentSlideData.title || "Hero image"}
              fill
              className="object-cover"
              priority
              unoptimized
              sizes="100vw"
            />
          </div>
        )}
      </div>

      {/* Dark overlay for better text readability */}
      {showDarkOverlay && (currentSlideData.title || currentSlideData.description) && (
        <div className="absolute inset-0 bg-black/40 z-[5]" />
      )}


      {/* Overlay Image */}
      {currentSlideData.overlayImage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={currentSlideData.overlayImage}
              alt=""
              width={350}
              height={263}
              className="w-auto h-auto max-w-[70%] sm:max-w-[50%] md:max-w-[40%] lg:max-w-[35%] max-h-[40%] sm:max-h-[35%] md:max-h-[30%] object-contain"
              priority
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {(currentSlideData.title || currentSlideData.description || currentSlideData.buttonText) && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8">
          {currentSlideData.title && (
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-center mb-4 md:mb-6 text-brand-white">
              {currentSlideData.title}
            </h1>
          )}
          {currentSlideData.description && (
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-center text-brand-white mb-6 md:mb-8 max-w-2xl px-4">
              {currentSlideData.description}
            </p>
          )}
          {currentSlideData.buttonText && currentSlideData.buttonLink && (
            <Link href={currentSlideData.buttonLink}>
              <Button
                size="lg"
                className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-4 sm:py-5 md:py-6 bg-brand-white text-brand-black hover:bg-brand-sweet-bianca"
              >
                {currentSlideData.buttonText}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-70 group-hover:opacity-100 hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-70 group-hover:opacity-100 hover:opacity-100 animate-pulse"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-brand-white w-6 sm:w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

