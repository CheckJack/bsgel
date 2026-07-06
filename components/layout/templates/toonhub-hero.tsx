/**
 * Saved homepage template — scroll-pinned 3D product hero (Toonhub-style).
 * Not mounted on the homepage. To reuse:
 *   import { ToonhubHero } from "@/components/layout/templates/toonhub-hero";
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const DESKTOP_MQ = "(min-width: 1024px)";
/** Viewport-height scroll budget per slide while the hero is pinned. */
const SLIDE_SCROLL_VH = 100;

const IMAGES = [
  {
    src: "/338 Neon Zest.png",
    bg: "#ECEE82",
    panel: "#ED9DC4",
    title: "NEON ZEST",
    description:
      "A high-impact neon with zesty undertones. Perfect when you want a daring pop of color with maximum visual punch.",
    gallery: [
      "/toonhub/neon-zest/biogel.jpg",
      "/toonhub/neon-zest/hand-1.jpg",
      "/toonhub/neon-zest/hand-2.jpg",
      "/toonhub/neon-zest/hand-3.jpg",
      "/toonhub/neon-zest/hand-product-2.jpg",
      "/toonhub/neon-zest/hand-product-3.jpg",
      "/toonhub/neon-zest/spatula.jpg",
    ],
  },
  {
    src: "/340 Purple Plasma.png",
    bg: "#9D5D8E",
    panel: "#F79B7F",
    title: "PURPLE PLASMA",
    description:
      "A vivid violet with bold personality and glossy depth. Designed to stand out with a confident, electric finish.",
    gallery: [
      "/toonhub/purple-plasma/brush.jpg",
      "/toonhub/purple-plasma/hand-1.jpg",
      "/toonhub/purple-plasma/hand-3.jpg",
      "/toonhub/purple-plasma/hand-gemini.jpg",
      "/toonhub/purple-plasma/hand-product-3.jpg",
      "/toonhub/purple-plasma/hand-product-4.jpg",
      "/toonhub/purple-plasma/spatula.jpg",
    ],
  },
  {
    src: "/341 Coral Crush (1).png",
    bg: "#E66781",
    panel: "#85CC92",
    title: "CORAL CRUSH",
    description:
      "A vibrant coral tone with warm energy and playful brightness. A statement shade that keeps the look fresh and modern.",
    gallery: [
      "/toonhub/coral-crush/brush.jpg",
      "/toonhub/coral-crush/hand-1.jpg",
      "/toonhub/coral-crush/hand-4.jpg",
      "/toonhub/coral-crush/hand-gemini-1.jpg",
      "/toonhub/coral-crush/hand-gemini-6.jpg",
      "/toonhub/coral-crush/hand-gemini-7.jpg",
      "/toonhub/coral-crush/hand-gemini-8.jpg",
    ],
  },
  {
    src: "/339 Electric Tide.png",
    bg: "#4782BA",
    panel: "#8DC4FF",
    title: "ELECTRIC TIDE",
    description:
      "A charged blue inspired by wave energy and movement. Crisp, vibrant, and ideal for bold contemporary sets.",
    gallery: [
      "/toonhub/electric-tide/brush.jpg",
      "/toonhub/electric-tide/biogel.jpg",
      "/toonhub/electric-tide/hand-1.jpg",
      "/toonhub/electric-tide/hand-2.jpg",
      "/toonhub/electric-tide/hand-product.jpg",
      "/toonhub/electric-tide/hand.jpg",
      "/toonhub/electric-tide/spatula.jpg",
    ],
  },
  {
    src: "/342 Tropic Fire.png",
    bg: "#A72616",
    panel: "#A72616",
    title: "TROPIC FIRE",
    description:
      "A fiery tropical red with rich intensity and warmth. Built to deliver a bold, high-energy statement in every look.",
    gallery: [
      "/toonhub/tropic-fire/brush.jpg",
      "/toonhub/tropic-fire/gemini.jpg",
      "/toonhub/tropic-fire/hand-1.jpg",
      "/toonhub/tropic-fire/hand-2.jpg",
      "/toonhub/tropic-fire/hand-gemini-1.jpg",
      "/toonhub/tropic-fire/hand-gemini-3.jpg",
      "/toonhub/tropic-fire/hand-product-1.jpg",
    ],
  },
];

type Direction = "next" | "prev";

export function ToonhubHero() {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const scrollSyncingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showBurstGallery, setShowBurstGallery] = useState(false);
  const [headerPx, setHeaderPx] = useState(113);
  const [viewportHeroHeight, setViewportHeroHeight] = useState<number | null>(null);

  const setSlideIndex = useCallback((index: number) => {
    const clamped = Math.min(IMAGES.length - 1, Math.max(0, index));
    if (activeIndexRef.current === clamped) return;
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
  }, []);

  const scrollToSlideIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track || viewportHeroHeight == null) return;

      const viewportH = window.innerHeight;
      const scrollable = track.offsetHeight - (viewportH - headerPx);
      if (scrollable <= 0) return;

      const start = track.offsetTop;
      const progress = index / Math.max(1, IMAGES.length - 1);
      scrollSyncingRef.current = true;
      window.scrollTo({ top: start + progress * scrollable, left: 0, behavior });
      window.setTimeout(
        () => {
          scrollSyncingRef.current = false;
        },
        behavior === "smooth" ? 550 : 80
      );
    },
    [headerPx, viewportHeroHeight]
  );

  useEffect(() => {
    const updateHeroHeight = () => {
      const headerEl = document.querySelector<HTMLElement>("[data-site-header]");
      const headerHeight = headerEl?.getBoundingClientRect().height ?? 113;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setHeaderPx(headerHeight);
      setViewportHeroHeight(Math.max(viewportHeight - headerHeight, 320));
      setIsDesktop(window.matchMedia(DESKTOP_MQ).matches);
      document.documentElement.style.setProperty("--site-header-height", `${headerHeight}px`);
    };

    updateHeroHeight();
    window.addEventListener("resize", updateHeroHeight);
    window.visualViewport?.addEventListener("resize", updateHeroHeight);

    const headerEl = document.querySelector<HTMLElement>("[data-site-header]");
    const observer = headerEl ? new ResizeObserver(() => updateHeroHeight()) : null;
    if (headerEl && observer) {
      observer.observe(headerEl);
    }

    return () => {
      window.removeEventListener("resize", updateHeroHeight);
      window.visualViewport?.removeEventListener("resize", updateHeroHeight);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    IMAGES.forEach((item) => {
      const img = new Image();
      img.src = item.src;
      if ("gallery" in item && Array.isArray(item.gallery)) {
        item.gallery.forEach((gallerySrc) => {
          const galleryImg = new Image();
          galleryImg.src = gallerySrc;
        });
      }
    });
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!isDesktop || viewportHeroHeight == null) return;

    const track = trackRef.current;
    if (!track) return;

    const updateFromScroll = () => {
      if (scrollSyncingRef.current) return;

      const viewportH = window.innerHeight;
      const scrollable = track.offsetHeight - (viewportH - headerPx);
      if (scrollable <= 0) return;

      const start = track.offsetTop;
      const rawProgress = Math.min(
        1,
        Math.max(0, (window.scrollY - start) / scrollable)
      );
      const index = Math.round(rawProgress * (IMAGES.length - 1));
      setSlideIndex(index);
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateFromScroll();
      });
    };

    updateFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateFromScroll);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [headerPx, isDesktop, setSlideIndex, viewportHeroHeight]);

  const navigate = (direction: Direction) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const next =
      direction === "next"
        ? Math.min(IMAGES.length - 1, activeIndex + 1)
        : Math.max(0, activeIndex - 1);
    setSlideIndex(next);
    if (isDesktop) scrollToSlideIndex(next, "smooth");
    window.setTimeout(() => setIsAnimating(false), 650);
  };

  const roles = useMemo(() => {
    const center = activeIndex;
    const left = (activeIndex + 3) % IMAGES.length;
    const right = (activeIndex + 1) % IMAGES.length;
    const back = (activeIndex + 2) % IMAGES.length;
    return { center, left, right, back };
  }, [activeIndex]);

  const getRoleStyle = (index: number): React.CSSProperties => {
    const baseWidth = isMobile ? "34%" : "20%";

    if (index === roles.center) {
      return {
        transform: "translate3d(-50%, -50%, 140px) rotateY(0deg) scale(1)",
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 30,
        left: "50%",
        top: "50%",
        width: baseWidth,
      };
    }

    if (index === roles.right) {
      return {
        transform: "translate3d(-50%, -50%, 10px) rotateY(-34deg) scale(0.82)",
        filter: "blur(1px)",
        opacity: 0,
        zIndex: 20,
        left: isMobile ? "78%" : "74%",
        top: "50%",
        width: baseWidth,
      };
    }

    if (index === roles.left) {
      return {
        transform: "translate3d(-50%, -50%, 10px) rotateY(34deg) scale(0.82)",
        filter: "blur(1px)",
        opacity: 0,
        zIndex: 20,
        left: isMobile ? "22%" : "26%",
        top: "50%",
        width: baseWidth,
      };
    }

    if (index === roles.back) {
      return {
        transform: "translate3d(-50%, -50%, -120px) rotateY(-50deg) scale(0.66)",
        filter: "blur(2.5px)",
        opacity: 0,
        zIndex: 10,
        left: isMobile ? "88%" : "86%",
        top: "50%",
        width: baseWidth,
      };
    }

    return {
      transform: "translate3d(-50%, -50%, -120px) rotateY(50deg) scale(0.66)",
      filter: "blur(2.5px)",
      opacity: 0,
      zIndex: 5,
      left: isMobile ? "12%" : "14%",
      top: "50%",
      width: baseWidth,
    };
  };

  const isNeonZestSlide = IMAGES[activeIndex].src === "/338 Neon Zest.png";
  const accentColor = isNeonZestSlide ? "#000000" : "#FFFFFF";
  const accentSoft = isNeonZestSlide ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.9)";
  const accentBody = isNeonZestSlide ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)";
  const splashLogoSrc = isNeonZestSlide
    ? "/splash-theory-black.svg"
    : "/splash-theory-white.svg";
  const activeGalleryImages =
    "gallery" in IMAGES[activeIndex] && Array.isArray(IMAGES[activeIndex].gallery)
      ? IMAGES[activeIndex].gallery
      : [];

  useEffect(() => {
    setShowBurstGallery(false);
  }, [activeIndex]);

  const heroHeightPx =
    viewportHeroHeight ?? `calc(100dvh - var(--site-header-height, 113px))`;
  const heroHeightStyle =
    typeof heroHeightPx === "number" ? `${heroHeightPx}px` : heroHeightPx;

  const scrollTrackHeight =
    isDesktop && typeof viewportHeroHeight === "number"
      ? `calc(${viewportHeroHeight}px + ${(IMAGES.length - 1) * SLIDE_SCROLL_VH}vh)`
      : heroHeightStyle;

  const heroPanel = (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: "background-color 650ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 50,
            opacity: 0.4,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 flex select-none items-center justify-center"
          style={{ zIndex: 2, top: "18%" }}
        >
          <img
            src={splashLogoSrc}
            alt="Splash Theory"
            style={{
              width: "clamp(280px, 72vw, 1200px)",
              maxWidth: "92vw",
              height: "auto",
              lineHeight: 1,
              opacity: 0.9,
            }}
            draggable={false}
          />
        </div>

        <div className="absolute left-4 top-6 sm:left-8" style={{ zIndex: 60 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accentSoft }}>
            NEW COLLECTION
          </p>
        </div>

        <div
          className="absolute inset-0"
          style={{ zIndex: 3, perspective: "1300px", transformStyle: "preserve-3d" }}
        >
          {activeGalleryImages.length > 0 && (
            <div className="pointer-events-none absolute inset-0" style={{ zIndex: 12 }}>
              {activeGalleryImages.map((photoSrc, idx) => {
                const spreadTransforms = [
                  "translate(-235%, -72%) rotate(-14deg)",
                  "translate(-170%, -82%) rotate(-8deg)",
                  "translate(-105%, -88%) rotate(-3deg)",
                  "translate(105%, -88%) rotate(3deg)",
                  "translate(170%, -82%) rotate(8deg)",
                  "translate(235%, -72%) rotate(14deg)",
                  "translate(0%, -86%) rotate(0deg)",
                ];
                return (
                  <img
                    key={photoSrc}
                    src={photoSrc}
                    alt="Neon Zest gallery"
                    className="absolute rounded-lg object-cover shadow-2xl"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: isMobile ? "92px" : "148px",
                      height: isMobile ? "112px" : "180px",
                      opacity: showBurstGallery ? 0.95 : 0,
                      transform: showBurstGallery
                        ? spreadTransforms[idx % spreadTransforms.length]
                        : "translate(-50%, -50%) scale(0.5) rotate(0deg)",
                      transition:
                        "transform 550ms cubic-bezier(0.22,1,0.36,1), opacity 450ms ease",
                      transitionDelay: `${idx * 35}ms`,
                    }}
                    draggable={false}
                  />
                );
              })}
            </div>
          )}

          {IMAGES.map((item, index) => (
            <div
              key={item.src}
              className="absolute"
              style={{
                position: "absolute",
                transition:
                  "transform 780ms cubic-bezier(0.22,1,0.36,1), filter 780ms cubic-bezier(0.22,1,0.36,1), opacity 780ms cubic-bezier(0.22,1,0.36,1), left 780ms cubic-bezier(0.22,1,0.36,1)",
                willChange: "transform, filter, opacity, left",
                transformStyle: "preserve-3d",
                ...getRoleStyle(index),
              }}
            >
              <div
                className="flex h-full w-full items-center justify-center rounded-xl"
                style={{ padding: "clamp(6px, 1vw, 10px)" }}
              >
                <img
                  src={item.src}
                  alt="Toonhub figurine"
                  draggable={false}
                  className="block h-auto w-auto max-h-[72vh] max-w-full object-contain"
                  style={{ objectPosition: "bottom center" }}
                  onMouseEnter={() => {
                    if (activeGalleryImages.length > 0 && index === roles.center) {
                      setShowBurstGallery(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (activeGalleryImages.length > 0 && index === roles.center) {
                      setShowBurstGallery(false);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: 320 }}
        >
          <p className="mb-2 text-base font-bold uppercase tracking-widest sm:mb-3 sm:text-[22px]" style={{ color: accentSoft }}>
            {IMAGES[activeIndex].title}
          </p>
          <p className="mb-4 hidden text-xs leading-[1.6] sm:mb-5 sm:block sm:text-sm" style={{ color: accentBody }}>
            {IMAGES[activeIndex].description}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => navigate("prev")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-105 sm:h-16 sm:w-16"
              style={{ borderColor: accentColor, color: accentColor, backgroundColor: "transparent" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = isNeonZestSlide
                  ? "rgba(0,0,0,0.12)"
                  : "rgba(255,255,255,0.12)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => navigate("next")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-105 sm:h-16 sm:w-16"
              style={{ borderColor: accentColor, color: accentColor, backgroundColor: "transparent" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = isNeonZestSlide
                  ? "rgba(0,0,0,0.12)"
                  : "rgba(255,255,255,0.12)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <div
          className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10"
          style={{ zIndex: 60 }}
        >
          <a
            href="#"
            className="font-futura flex items-center gap-2 no-underline transition-opacity duration-200 hover:opacity-100"
            style={{
              fontSize: "clamp(20px, 4vw, 56px)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: accentSoft,
            }}
          >
            <span>DISCOVER IT</span>
            <ArrowRight className="h-5 w-5 sm:h-8 sm:w-8" strokeWidth={2.25} />
          </a>
        </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ height: heroHeightStyle, fontFamily: "Inter, sans-serif" }}
        data-toonhub-hero
      >
        {heroPanel}
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className="relative w-full"
      style={{ height: scrollTrackHeight }}
      data-toonhub-scroll-track
    >
      <div
        className="sticky inset-x-0 z-[50] overflow-hidden"
        style={{
          top: headerPx,
          height: heroHeightStyle,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {heroPanel}
      </div>
    </div>
  );
}

