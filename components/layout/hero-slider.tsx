"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Slide {
  type: "video" | "image";
  src: string;
  /** When set on an image slide, shown below the `md` breakpoint instead of `src`. */
  srcMobile?: string;
  /** When set with `srcMobile`, shown from `md` until below `lg` (tablet). Desktop uses `src`. */
  srcTablet?: string;
  title?: string;
  titleLine2?: string;
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
  onFirstSlideReady?: () => void;
}

export function HeroSlider({
  slides,
  autoPlayInterval = 5000,
  className,
  showDarkOverlay = true,
  scrollControlled = false,
  onFirstSlideReady,
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstSlideReadyReportedRef = useRef(false);

  const reportFirstSlideReady = () => {
    if (firstSlideReadyReportedRef.current) return;
    firstSlideReadyReportedRef.current = true;
    onFirstSlideReady?.();
  };

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length, autoPlayInterval]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === currentSlide && !scrollControlled) {
        void video.play().catch(() => {});
      } else {
        video.pause();
        if (!scrollControlled) {
          video.currentTime = 0;
        }
      }
    });
  }, [currentSlide, scrollControlled]);

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

  // Only apply 100vh styles if no custom className is provided (default behavior)
  const hasCustomHeight = className && className !== "h-screen";
  const containerStyle: React.CSSProperties = hasCustomHeight
    ? { position: "relative", top: 0, left: 0, right: 0 }
    : {
        height: "100vh",
        minHeight: "100vh",
        position: "relative",
        top: 0,
        left: 0,
        right: 0,
      };

  const firstSlideFallback =
    slides[0]?.type === "image"
      ? slides[0].src || slides[0].srcTablet || slides[0].srcMobile
      : undefined;
  const mergedContainerStyle: React.CSSProperties = {
    ...containerStyle,
    ...(firstSlideFallback
      ? {
          backgroundImage: `url("${firstSlideFallback}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {}),
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${className || "h-screen"} overflow-hidden group`}
      style={mergedContainerStyle}
    >
      {/* Slide Content */}
      <div className="absolute inset-0 w-full h-full" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={`${slide.type}-${slide.src}-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              style={{ willChange: "opacity" }}
            >
              {slide.type === "video" ? (
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                    if (isActive) {
                      videoRef.current = el;
                    }
                  }}
                  autoPlay={!scrollControlled}
                  loop={!scrollControlled}
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ top: 0, left: 0, width: "100%", height: "100%" }}
                  onLoadedData={index === 0 ? reportFirstSlideReady : undefined}
                  onError={index === 0 ? reportFirstSlideReady : undefined}
                >
                  <source src={slide.src} type="video/mp4" />
                </video>
              ) : (
                <div className="relative w-full h-full">
                  {slide.srcMobile && slide.srcTablet ? (
                    <>
                      <Image
                        src={slide.srcMobile}
                        alt={slide.title || "Hero image"}
                        fill
                        className="!object-cover md:hidden"
                        priority={index === 0}
                        unoptimized
                        sizes="100vw"
                        onLoadingComplete={index === 0 ? reportFirstSlideReady : undefined}
                        onError={index === 0 ? reportFirstSlideReady : undefined}
                      />
                      <Image
                        src={slide.srcTablet}
                        alt={slide.title || "Hero image"}
                        fill
                        className="!object-cover hidden md:block lg:hidden"
                        priority={index === 0}
                        unoptimized
                        sizes="100vw"
                        onLoadingComplete={index === 0 ? reportFirstSlideReady : undefined}
                        onError={index === 0 ? reportFirstSlideReady : undefined}
                      />
                      <Image
                        src={slide.src}
                        alt={slide.title || "Hero image"}
                        fill
                        className="!object-cover hidden lg:block"
                        priority={index === 0}
                        unoptimized
                        sizes="100vw"
                        onLoadingComplete={index === 0 ? reportFirstSlideReady : undefined}
                        onError={index === 0 ? reportFirstSlideReady : undefined}
                      />
                    </>
                  ) : slide.srcMobile ? (
                    <>
                      <Image
                        src={slide.srcMobile}
                        alt={slide.title || "Hero image"}
                        fill
                        className="!object-cover md:hidden"
                        priority={index === 0}
                        unoptimized
                        sizes="100vw"
                        onLoadingComplete={index === 0 ? reportFirstSlideReady : undefined}
                        onError={index === 0 ? reportFirstSlideReady : undefined}
                      />
                      <Image
                        src={slide.src}
                        alt={slide.title || "Hero image"}
                        fill
                        className="!object-cover hidden md:block"
                        priority={index === 0}
                        unoptimized
                        sizes="100vw"
                        onLoadingComplete={index === 0 ? reportFirstSlideReady : undefined}
                        onError={index === 0 ? reportFirstSlideReady : undefined}
                      />
                    </>
                  ) : (
                    <Image
                      src={slide.src}
                      alt={slide.title || "Hero image"}
                      fill
                      className="!object-cover"
                      priority={index === 0}
                      unoptimized
                      sizes="100vw"
                      onLoadingComplete={index === 0 ? reportFirstSlideReady : undefined}
                      onError={index === 0 ? reportFirstSlideReady : undefined}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dark overlay for better text readability */}
      {showDarkOverlay && (currentSlideData.title || currentSlideData.titleLine2) && (
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

      {/* Title and Button Content - Bottom Left */}
      {(currentSlideData.title || currentSlideData.titleLine2 || currentSlideData.description || currentSlideData.buttonText) && (
        <div className="absolute bottom-12 sm:bottom-16 md:bottom-20 lg:bottom-24 xl:bottom-28 left-4 sm:left-6 md:left-8 lg:left-12 xl:left-16 z-10">
          {(currentSlideData.title || currentSlideData.titleLine2) && (
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-left mb-4 md:mb-6 text-brand-white tracking-tight leading-tight">
              {currentSlideData.title && (
                <span className="block">{currentSlideData.title}</span>
              )}
              {currentSlideData.titleLine2 && (
                <span className="block">{currentSlideData.titleLine2}</span>
              )}
            </h1>
          )}
          {currentSlideData.description && (
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-normal text-left text-brand-white mb-4 md:mb-6">
              {currentSlideData.description}
            </p>
          )}
          {currentSlideData.buttonText && currentSlideData.buttonLink && (
            <Link 
              href={currentSlideData.buttonLink}
              className="inline-block text-brand-white border-b-2 border-brand-white pb-1 text-sm sm:text-base md:text-lg font-futura uppercase tracking-wider hover:opacity-80 transition-opacity mt-4 md:mt-6"
            >
              {currentSlideData.buttonText}
            </Link>
          )}
        </div>
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center transition-all opacity-70 group-hover:opacity-100 hover:opacity-100 touch-manipulation min-w-[44px] min-h-[44px]"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center transition-all opacity-70 group-hover:opacity-100 hover:opacity-100 animate-pulse touch-manipulation min-w-[44px] min-h-[44px]"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

    </div>
  );
}

