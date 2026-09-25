"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";

/** Desktop background (Mobily6). */
const BACKGROUND_IMAGE_DESKTOP = "/home-enzyme-scrub-background-desktop.jpg?v=7";
/** Tablet background (Mobily5). */
const BACKGROUND_IMAGE_TABLET = "/home-enzyme-scrub-background-tablet.jpg?v=5";
/** Mobile background (Mobily4). */
const BACKGROUND_IMAGE_MOBILE = "/home-enzyme-scrub-background-mobile.jpg?v=5";
/** Exact top plate JPEG — no alpha remask (avoids flood-fill fringe). */
const PRODUCT_IMAGE = "/home-enzyme-scrub-product-source.jpg";
/** Cursor-follow hover preview (symlink → Natural Nail Treatments Relaunch). */
const CURSOR_PREVIEW_VIDEO = "/home-enzyme-scrub-preview.mp4";
const TREATMENTS_HREF = "/natural-nail-treatments";

/** Reference canvas sizes for title scale / intrinsic img hints (match file pixels). */
const FRAME_W_DESKTOP = 1024;
const FRAME_H_DESKTOP = 576;
const FRAME_W_TABLET = 1024;
const FRAME_H_TABLET = 620;
const FRAME_W_MOBILE = 819;
const FRAME_H_MOBILE = 1024;

const titleBaseClass =
  "font-display max-w-[88%] text-center font-normal tracking-tight text-balance leading-[1.08] sm:max-w-[92%] md:leading-none lg:max-w-none lg:whitespace-nowrap";

/** Responsive title scale — larger and centered on mobile; desktop unchanged. */
const titleFontSizeClass =
  "text-[clamp(1.85rem,8cqw,2.75rem)] sm:text-[clamp(2.05rem,8.5cqw,3rem)] md:text-[clamp(2.2rem,9cqw,3.25rem)] lg:text-[clamp(1.75rem,7cqw,4.5rem)]";

const sectionShellClass =
  "relative w-full cursor-pointer overflow-hidden bg-[#f3ece8]";

/**
 * Full-bleed left→right: w-full + h-auto keeps intrinsic aspect (no stretch).
 * Desktop asset should be ≥2560×1440 so it stays sharp when scaled to viewport width.
 */
const mobileBackgroundImageClass =
  "relative z-0 block h-auto w-full md:hidden";

const tabletBackgroundImageClass =
  "relative z-0 hidden h-auto w-full md:block lg:hidden";

const desktopBackgroundImageClass =
  "relative z-0 hidden h-auto w-full lg:block";


/**
 * Full-frame luminance mask from the product plate (same cover/center as the
 * product <img>) so white glyphs only show over the bottle silhouette.
 */
const productMaskStyle = {
  maskImage: `url(${PRODUCT_IMAGE})`,
  maskSize: "cover",
  maskPosition: "center",
  maskRepeat: "no-repeat",
  WebkitMaskImage: `url(${PRODUCT_IMAGE})`,
  WebkitMaskSize: "cover",
  WebkitMaskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
} as const;

/** Offset so the preview sits just past the pointer tip. */
const PREVIEW_OFFSET_X = 20;
const PREVIEW_OFFSET_Y = 20;

/** Cursor-follow preview size — larger on desktop, scaled down on tablet/mobile. */
const previewFrameClass =
  "pointer-events-none absolute left-0 top-0 z-[25] overflow-hidden rounded-lg " +
  "bg-brand-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] will-change-transform " +
  "transition-opacity duration-200 " +
  "w-[min(300px,78vw)] " +
  "sm:w-[min(360px,55vw)] " +
  "md:w-[min(420px,46vw)] " +
  "lg:w-[min(480px,36vw)] " +
  "xl:w-[min(520px,32vw)]";


export function HomeEnzymeScrubBanner() {
  const { t } = useLanguage();
  const router = useRouter();
  const title = t("home.enzymeScrubBannerTitle");

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const letterRevealRef = useRef<HTMLDivElement>(null);
  const letterRevealInnerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const hoveringRef = useRef(false);

  const [finePointer, setFinePointer] = useState(false);
  const [hovering, setHovering] = useState(false);
  /** Attach src only after first hover so we don't fetch ~58MB off-section. */
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    hoveringRef.current = hovering;
    const video = videoRef.current;
    if (!video || !loadVideo) return;

    if (hovering && finePointer) {
      void video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [hovering, finePointer, loadVideo]);

  const schedulePointer = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const preview = previewRef.current;
      const reveal = letterRevealRef.current;
      const revealInner = letterRevealInnerRef.current;
      const section = sectionRef.current;
      if (!preview || !section) return;

      const { x, y } = pointerRef.current;
      const tx = x + PREVIEW_OFFSET_X;
      const ty = y + PREVIEW_OFFSET_Y;
      const transform = `translate3d(${tx}px, ${ty}px, 0)`;

      preview.style.transform = transform;

      if (reveal && revealInner) {
        const pw = preview.offsetWidth;
        const ph = preview.offsetHeight;
        reveal.style.transform = transform;
        reveal.style.width = `${pw}px`;
        reveal.style.height = `${ph}px`;
        revealInner.style.left = `${-tx}px`;
        revealInner.style.top = `${-ty}px`;
        revealInner.style.width = `${section.clientWidth}px`;
        revealInner.style.height = `${section.clientHeight}px`;
      }
    });
  }, []);

  const updatePointerFromEvent = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      schedulePointer();
    },
    [schedulePointer]
  );

  const onPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!finePointer || e.pointerType !== "mouse") return;
      updatePointerFromEvent(e);
      setLoadVideo(true);
      setHovering(true);
    },
    [finePointer, updatePointerFromEvent]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!finePointer || e.pointerType !== "mouse") return;
      updatePointerFromEvent(e);
      if (!hoveringRef.current) {
        setLoadVideo(true);
        setHovering(true);
      }
    },
    [finePointer, updatePointerFromEvent]
  );

  const onPointerLeave = useCallback(() => {
    setHovering(false);
  }, []);

  const navigateToTreatments = useCallback(() => {
    router.push(TREATMENTS_HREF);
  }, [router]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateToTreatments();
      }
    },
    [navigateToTreatments]
  );

  const showPreview = finePointer && hovering;

  return (
    <section
      ref={sectionRef}
      role="link"
      tabIndex={0}
      className={sectionShellClass}
      aria-label={t("home.enzymeScrubBannerLinkAria")}
      onClick={navigateToTreatments}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="@container group relative isolate w-full">
          <img
            src={BACKGROUND_IMAGE_MOBILE}
            alt={t("home.enzymeScrubBannerProductAlt")}
            width={FRAME_W_MOBILE}
            height={FRAME_H_MOBILE}
            className={mobileBackgroundImageClass}
            decoding="async"
          />
          <img
            src={BACKGROUND_IMAGE_TABLET}
            alt=""
            aria-hidden
            width={FRAME_W_TABLET}
            height={FRAME_H_TABLET}
            className={tabletBackgroundImageClass}
            decoding="async"
          />
          <img
            src={BACKGROUND_IMAGE_DESKTOP}
            alt=""
            aria-hidden
            width={FRAME_W_DESKTOP}
            height={FRAME_H_DESKTOP}
            className={desktopBackgroundImageClass}
            decoding="async"
          />

        {/* Subtle scrim on smaller viewports for centered title legibility */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-black/10 lg:hidden"
        />

        <div className="pointer-events-none absolute inset-0 z-10 group-hover:z-30 group-focus-within:z-30">
          <div className="absolute inset-0 flex items-center justify-center px-5 sm:px-6 lg:px-0">
            <h2
              id="home-enzyme-scrub-heading"
              className={`${titleBaseClass} ${titleFontSizeClass} text-brand-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] lg:drop-shadow-none`}
            >
              {title}
            </h2>
          </div>

          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center px-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 max-lg:hidden lg:items-center lg:px-0"
            style={productMaskStyle}
          >
            <span className={`${titleBaseClass} ${titleFontSizeClass} text-brand-white`}>
              {title}
            </span>
          </div>
        </div>

        {/*
          Layer 4 — cursor video below title layers (z-25 < title hover z-30).
          Fine-pointer only. Src attaches on first hover so touch / off-section
          never pulls the preview file.
        */}
        {finePointer ? (
          <div
            ref={previewRef}
            aria-hidden
            className={`${previewFrameClass} ${
              showPreview ? "opacity-100" : "opacity-0"
            }`}
            style={{ transform: "translate3d(-9999px,-9999px,0)" }}
          >
            <video
              ref={videoRef}
              className="block h-auto w-full object-cover"
              src={loadVideo ? CURSOR_PREVIEW_VIDEO : undefined}
              muted
              loop
              playsInline
              preload="none"
              onCanPlay={() => {
                if (hoveringRef.current) {
                  void videoRef.current?.play().catch(() => {});
                }
                // Sync letter-reveal window size once video dimensions are known.
                schedulePointer();
              }}
            />
          </div>
        ) : null}

        {/*
          Layer 5 — brand-pink title clipped to the moving video rect (same
          transform + size as the preview). Sits above white bottle mask so
          glyphs over the video footprint read as pink-900 (#6B1839).
        */}
        {finePointer ? (
          <div
            ref={letterRevealRef}
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 z-40 overflow-hidden rounded-lg will-change-transform transition-opacity duration-200 ${
              showPreview ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transform: "translate3d(-9999px,-9999px,0)",
              width: 0,
              height: 0,
            }}
          >
            <div
              ref={letterRevealInnerRef}
              className="absolute flex items-center justify-center"
              style={{ left: 0, top: 0 }}
            >
              <span
                className={`${titleBaseClass} ${titleFontSizeClass} text-pink-900`}
              >
                {title}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
