"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { useCart } from "@/contexts/cart-context";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  COLOUR_BUILDER_HERO_SOURCE,
  type ColourBuilderProduct,
  fetchColourBuilderProducts,
} from "@/lib/colour-builder-hero";
import { cn, formatPrice } from "@/lib/utils";
import { setAppScrollLocked } from "@/lib/mobile-scroll-root";

type BannerSlideId = "shipping" | "colour-builder" | "experience-kit";
type ActivePopup = BannerSlideId | null;

const PROMO_POPUP_DIALOG_CLASS =
  "relative grid w-full overflow-hidden rounded-2xl bg-brand-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] max-h-[min(90dvh,640px)]";

const PROMO_SHIPPING_DIALOG_CLASS =
  "relative flex h-auto w-full max-w-lg max-h-[min(90dvh,640px)] flex-col overflow-hidden rounded-2xl bg-brand-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] md:grid md:max-w-3xl md:grid-cols-[0.92fr_1.08fr]";

const PROMO_COLOUR_DIALOG_CLASS =
  "relative flex w-full max-h-[min(92dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl bg-brand-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] md:grid md:max-h-[min(92dvh,680px)]";

const BANNER_SLIDES: BannerSlideId[] = ["shipping", "colour-builder", "experience-kit"];
const KIT_EXPERIENCIA_PRODUCT_URL = "/products/9d720113-d82b-4f8d-ab47-0960d78a1026";
const AUTO_ADVANCE_MS = 7000;

function PromoColourProductCard({ product }: { product: ColourBuilderProduct }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const productUrl = `/products/${product.id}`;
  const displayPrice =
    product.salePrice != null && product.salePrice !== ""
      ? product.salePrice
      : product.price;

  const handleAddToCart = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (product.outOfStock) return;
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(productUrl)}`);
      return;
    }

    setIsAdding(true);
    try {
      const ok = await addItem(product.id, 1);
      if (ok) {
        window.dispatchEvent(new CustomEvent("openCartDrawer"));
        toast(
          language === "pt" ? "Adicionado ao carrinho" : "Added to cart",
          "success",
          2500
        );
      } else {
        toast(
          language === "pt"
            ? "Não foi possível adicionar. Tente novamente."
            : "Could not add to cart. Please try again.",
          "error"
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className="group flex min-w-0 flex-col">
      <Link
        href={productUrl}
        className="relative mb-3 flex h-36 items-end justify-center overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.01] sm:h-40"
        style={{ backgroundColor: product.background }}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={COLOUR_BUILDER_HERO_SOURCE.width}
            height={COLOUR_BUILDER_HERO_SOURCE.height}
            className="block h-[94%] w-auto max-w-[68%] object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
            sizes="(max-width: 640px) 30vw, 120px"
          />
        ) : null}
      </Link>

      <p className="font-header text-[10px] uppercase tracking-[0.16em] text-brand-black/45">
        Colour Builder Gel
      </p>
      <Link
        href={productUrl}
        className="mt-0.5 font-display text-lg font-normal leading-tight tracking-tight text-brand-black transition-opacity hover:opacity-75 sm:text-xl"
      >
        {product.shadeName}
      </Link>

      <p className="mt-1 font-header text-sm text-brand-black/70">{formatPrice(displayPrice)}</p>

      <button
        type="button"
        disabled={product.outOfStock || isAdding}
        onClick={handleAddToCart}
        className={cn(
          "font-header mt-2 inline-flex h-auto items-center self-start bg-transparent px-0 text-[11px] uppercase tracking-[0.1em] text-pink-900 underline underline-offset-[3px] transition-colors hover:text-pink-800",
          "max-md:rounded-none max-md:py-0",
          "md:mt-2.5 md:h-7 md:rounded-full md:bg-pink-900 md:px-3 md:text-[10px] md:text-brand-white md:no-underline md:tracking-[0.12em] md:hover:bg-pink-800",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        {isAdding ? (
          <Loader2 className="mr-1 size-2.5 animate-spin md:mr-1.5 md:size-3" aria-hidden />
        ) : null}
        {product.outOfStock ? t("products.outOfStock") : t("products.add")}
      </button>
    </article>
  );
}

export function PromoBanner() {
  const { t } = useLanguage();
  const motionEnabled = useMotionEnabled();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const [colourProducts, setColourProducts] = useState<ColourBuilderProduct[]>([]);
  const [isLoadingColourProducts, setIsLoadingColourProducts] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const currentSlide = BANNER_SLIDES[activeSlide];

  const goToSlide = useCallback((index: number) => {
    setActiveSlide((index + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  const goToPreviousSlide = useCallback(() => {
    goToSlide(activeSlide - 1);
  }, [activeSlide, goToSlide]);

  const goToNextSlide = useCallback(() => {
    goToSlide(activeSlide + 1);
  }, [activeSlide, goToSlide]);

  const openPopupForSlide = useCallback((slideId: BannerSlideId) => {
    setActivePopup(slideId);
  }, []);

  useEffect(() => {
    if (activePopup || isHovered) return;

    const timer = window.setInterval(() => {
      setActiveSlide((index) => (index + 1) % BANNER_SLIDES.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [activePopup, isHovered]);

  useEffect(() => {
    if (activePopup !== "colour-builder") return;

    let cancelled = false;

    const loadProducts = async () => {
      setIsLoadingColourProducts(true);
      try {
        const items = await fetchColourBuilderProducts();
        if (!cancelled) setColourProducts(items);
      } catch (error) {
        console.error("Failed to load colour builder products for promo popup:", error);
        if (!cancelled) setColourProducts([]);
      } finally {
        if (!cancelled) setIsLoadingColourProducts(false);
      }
    };

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [activePopup]);

  useEffect(() => {
    if (!activePopup) return;

    setAppScrollLocked(true);
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePopup(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopup]);

  const handlePopupExitComplete = () => {
    document.documentElement.style.overflow = "";
    setAppScrollLocked(false);
  };

  const slideCopy =
    currentSlide === "shipping"
      ? t("header.promoBannerHeading")
      : currentSlide === "colour-builder"
        ? t("header.promoBannerColourBuilderHeading")
        : t("header.promoBannerExperienceKitHeading");

  const renderSlideCopy = () => {
    if (currentSlide === "experience-kit") {
      return (
        <>
          <span className="sm:hidden">{t("header.promoBannerExperienceKitHeadingMobile")}</span>
          <span className="hidden sm:inline">{t("header.promoBannerExperienceKitHeading")}</span>
        </>
      );
    }
    return slideCopy;
  };

  const popupFade = motionEnabled
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.28, ease: "easeOut" as const },
      }
    : {};

  const popupDialogMotion = motionEnabled
    ? {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 8 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {};

  const popupLayer =
    portalReady &&
    createPortal(
      <AnimatePresence onExitComplete={handlePopupExitComplete}>
        {activePopup === "shipping" && (
          <motion.div
            className="fixed inset-0 z-[1200]"
            role="presentation"
            {...popupFade}
          >
            <div
              className="promo-popup-backdrop fixed inset-0 bg-brand-black/55 backdrop-blur-[2px]"
              onClick={() => setActivePopup(null)}
              aria-hidden="true"
            />
            <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-shipping-dialog-title"
              className={PROMO_SHIPPING_DIALOG_CLASS}
              {...popupDialogMotion}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative aspect-[5/3] w-full shrink-0 overflow-hidden bg-brand-sweet-bianca md:aspect-auto md:min-h-0 md:h-full">
                <Image
                  src="/popup123-mobile.png"
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover object-center md:hidden"
                  priority
                />
                <Image
                  src="/popup123.png"
                  alt=""
                  fill
                  sizes="420px"
                  className="hidden object-cover object-center md:block"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-black/20 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-brand-white/10" />
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-brand-black backdrop-blur-sm transition-colors hover:border-brand-champagne hover:bg-brand-champagne/10 sm:right-4 sm:top-4"
                  aria-label={t("header.promoPopupClose")}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="relative flex flex-col justify-center px-6 py-6 sm:px-7 sm:py-7 md:px-8 md:py-8">
                <p className="font-header text-[10px] uppercase tracking-[0.18em] text-brand-champagne-dark sm:text-[11px]">
                  {t("header.promoPopupEyebrow")}
                </p>

                <h2
                  id="promo-shipping-dialog-title"
                  className="mt-2 font-display text-[1.5rem] font-normal leading-[1.08] tracking-tight text-brand-black sm:text-[1.65rem] md:text-[1.75rem]"
                >
                  {t("header.promoPopupTitle")}
                </h2>

                <p className="mt-3 font-header text-sm leading-relaxed text-brand-black/65">
                  {t("header.promoPopupMain")}
                </p>

                <ul className="mt-5 divide-y divide-black/[0.08] border-y border-black/[0.08]">
                  <li className="py-3.5">
                    <p className="font-header text-[10px] uppercase tracking-[0.14em] text-brand-champagne-dark">
                      {t("header.promoPopupMainlandLabel")}
                    </p>
                    <p className="mt-1 font-header text-sm leading-snug text-brand-black">
                      {t("header.promoPopupMainlandValue")}
                    </p>
                  </li>
                  <li className="py-3.5">
                    <p className="font-header text-[10px] uppercase tracking-[0.14em] text-brand-champagne-dark">
                      {t("header.promoPopupIslandsLabel")}
                    </p>
                    <p className="mt-1 font-header text-sm leading-snug text-brand-black">
                      {t("header.promoPopupIslandsValue")}
                    </p>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "font-header mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#857D71] px-6 text-xs uppercase tracking-[0.14em] text-brand-white hover:bg-brand-champagne-dark md:mt-5"
                  )}
                >
                  {t("header.promoPopupDismiss")}
                </button>
              </div>
            </motion.div>
            </div>
          </motion.div>
        )}

        {activePopup === "colour-builder" && (
          <motion.div
            className="fixed inset-0 z-[1200]"
            role="presentation"
            {...popupFade}
          >
            <div
              className="promo-popup-backdrop fixed inset-0 bg-brand-black/55 backdrop-blur-[2px]"
              onClick={() => setActivePopup(null)}
              aria-hidden="true"
            />
            <div className="relative z-10 flex h-full min-h-0 w-full items-center justify-center px-4 py-4 sm:py-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-colour-dialog-title"
              className={cn(
                PROMO_COLOUR_DIALOG_CLASS,
                "max-w-6xl md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
              )}
              {...popupDialogMotion}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative flex shrink-0 flex-col bg-[linear-gradient(160deg,#f7f4f1_0%,#ffffff_55%)] px-6 py-5 sm:px-8 sm:py-8 md:justify-between md:px-9 md:py-9">
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-brand-black backdrop-blur-sm transition-colors hover:border-brand-champagne hover:bg-brand-champagne/10"
                  aria-label={t("header.promoPopupClose")}
                >
                  <X className="size-4" aria-hidden />
                </button>

                <div>
                  <p className="font-header text-[10px] uppercase tracking-[0.18em] text-brand-champagne-dark sm:text-[11px]">
                    {t("home.splitHeroSlideEyebrow")}
                  </p>

                  <h2
                    id="promo-colour-dialog-title"
                    className="mt-2 pr-10 font-display text-[1.75rem] font-normal leading-[1.02] tracking-tight text-brand-black sm:text-[2rem] md:pr-0 md:text-[2.15rem]"
                  >
                    {t("home.splitHeroTitleLine1")}
                    <span className="block">{t("home.splitHeroTitleLine2")}</span>
                  </h2>

                  <p className="mt-3 hidden max-w-sm font-header text-sm leading-relaxed text-brand-black/65 md:mt-4 md:block">
                    {t("home.splitHeroDesc")}
                  </p>
                </div>

                <Link
                  href="/colours#products"
                  className="font-header mt-5 hidden items-center gap-2 text-xs uppercase tracking-[0.14em] text-brand-black transition-colors hover:text-brand-champagne-dark md:mt-8 md:inline-flex"
                >
                  {t("home.splitHeroCta")}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-black/8 bg-[#faf9f8] md:border-l md:border-t-0">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-7 sm:py-6">
                  {isLoadingColourProducts ? (
                    <div className="flex h-full min-h-[16rem] items-center justify-center gap-2 font-header text-sm text-brand-black/55">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {t("header.promoColourPopupLoading")}
                    </div>
                  ) : colourProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-4">
                      {colourProducts.map((product) => (
                        <PromoColourProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                      <p className="font-header text-sm text-brand-black/65">
                        {t("products.noProducts")}
                      </p>
                      <Link
                        href="/colours#products"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "mt-4 inline-flex px-5 py-2 text-sm"
                        )}
                      >
                        {t("home.splitHeroCta")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            </div>
          </motion.div>
        )}

        {activePopup === "experience-kit" && (
          <motion.div
            className="fixed inset-0 z-[1200]"
            role="presentation"
            {...popupFade}
          >
            <div
              className="promo-popup-backdrop fixed inset-0 bg-brand-black/55 backdrop-blur-[2px]"
              onClick={() => setActivePopup(null)}
              aria-hidden="true"
            />
            <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-experience-kit-dialog-title"
              className={cn(
                PROMO_POPUP_DIALOG_CLASS,
                "max-w-3xl sm:max-w-4xl md:grid-cols-[0.92fr_1.08fr]"
              )}
              {...popupDialogMotion}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative min-h-[14rem] overflow-hidden bg-brand-sweet-bianca sm:min-h-[16rem] md:min-h-0 md:h-full">
                <Image
                  src="/kit-experiencia-popup.png"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover object-top"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-black/25 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-brand-white/10" />
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-brand-black backdrop-blur-sm transition-colors hover:border-brand-champagne hover:bg-brand-champagne/10 sm:right-4 sm:top-4"
                  aria-label={t("header.promoPopupClose")}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="relative flex flex-col overflow-y-auto px-6 py-7 sm:px-8 sm:py-8 md:px-9 md:py-9">
                <p className="font-header text-[10px] uppercase tracking-[0.18em] text-brand-champagne-dark sm:text-[11px]">
                  {t("header.promoExperienceKitPopupEyebrow")}
                </p>

                <h2
                  id="promo-experience-kit-dialog-title"
                  className="mt-2 font-display text-[1.65rem] font-normal leading-[1.05] tracking-tight text-brand-black sm:text-3xl"
                >
                  {t("header.promoExperienceKitPopupTitle")}
                </h2>

                <p className="mt-3 font-header text-sm leading-relaxed text-brand-black/65">
                  {t("header.promoExperienceKitPopupMain")}{" "}
                  {t("header.promoExperienceKitPopupBenefit1")}{" "}
                  {t("header.promoExperienceKitPopupBenefit2")}
                </p>

                <Link
                  href={KIT_EXPERIENCIA_PRODUCT_URL}
                  onClick={() => setActivePopup(null)}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "font-header mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-pink-900 px-6 text-xs uppercase tracking-[0.14em] text-brand-white hover:bg-pink-800"
                  )}
                >
                  {t("header.promoExperienceKitPopupCta")}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <section
      aria-label={t("header.promoBannerHeading")}
      className="font-header relative bg-[#857D71]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-center px-11 py-2.5 sm:px-14 md:px-16">
        <button
          type="button"
          onClick={goToPreviousSlide}
          className="absolute left-6 flex size-7 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:left-8 sm:size-8 md:left-10"
          aria-label={t("header.promoBannerCarouselPrev")}
        >
          <ChevronLeft className="size-4 sm:size-[18px]" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          {motionEnabled ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={currentSlide}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="text-center text-xs font-normal text-white sm:text-sm"
              >
                {renderSlideCopy()}{" "}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => openPopupForSlide(currentSlide)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPopupForSlide(currentSlide);
                    }
                  }}
                  className="cursor-pointer text-xs font-normal leading-[inherit] text-white underline underline-offset-2 transition-opacity hover:opacity-80 sm:text-sm"
                >
                  {t("header.promoBannerLearnMore")}
                </span>
              </motion.p>
            </AnimatePresence>
          ) : (
            <p className="text-center text-xs font-normal text-white sm:text-sm">
              {renderSlideCopy()}{" "}
              <span
                role="button"
                tabIndex={0}
                onClick={() => openPopupForSlide(currentSlide)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPopupForSlide(currentSlide);
                  }
                }}
                className="cursor-pointer text-xs font-normal leading-[inherit] text-white underline underline-offset-2 sm:text-sm"
              >
                {t("header.promoBannerLearnMore")}
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={goToNextSlide}
          className="absolute right-6 flex size-7 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:right-8 sm:size-8 md:right-10"
          aria-label={t("header.promoBannerCarouselNext")}
        >
          <ChevronRight className="size-4 sm:size-[18px]" aria-hidden />
        </button>
      </div>

      {popupLayer}
    </section>
  );
}
