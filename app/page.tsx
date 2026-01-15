"use client";

import { HeroSlider } from "@/components/layout/hero-slider";
import { ProductShowcase } from "@/components/layout/product-showcase";
import { TrainingBanner } from "@/components/layout/training-banner";
import { ReasonsToTrain } from "@/components/layout/reasons-to-train";
import { FeaturedProducts } from "@/components/layout/featured-products";
import { AsSeenIn } from "@/components/layout/as-seen-in";
import { NailPolishDisplay } from "@/components/layout/nail-polish-display";
import { useLanguage } from "@/contexts/language-context";

export default function Home() {
  const { t } = useLanguage();

  const slides = [
    {
      type: "video" as const,
      src: "/csavasvsa.mp4",
      title: t("hero.becomeTherapist"),
      titleLine2: t("hero.becomeTherapistLine2"),
      buttonText: t("hero.learnMore"),
      buttonLink: "/training",
    },
    {
      type: "video" as const,
      src: "/moodywo4.mp4",
      overlayImage: "/MoodyJewels.png",
    },
  ];

  const productLines = [
    {
      image: "/Cuticle Oils (1).jpg",
      title: t("home.trainingKits"),
      description: t("home.trainingKitsDesc"),
      link: "/training",
      logo: "/ETHOSLOGO.png",
    },
    {
      image: "/328 Peach Pitstop - hand and product (5).jpg",
      title: t("home.bioSculpture"),
      description: t("home.bioSculptureDesc"),
      link: "/products",
      logo: "/biologo.png",
    },
    {
      image: "/123_Tracey_Wide - Copy.jpg",
      title: t("home.evo"),
      description: t("home.evoDesc"),
      link: "/evo",
      logo: "/EVOLOGO.png",
    },
    {
      image: "/SPA - Apricot Kernel Scrub  (21) (1).jpg",
      title: t("home.spa"),
      description: t("home.spaDesc"),
      link: "/spa",
      logo: "/SPALOGO.png",
    },
    {
      image: "/316 A Breath of Fresh Air - Creative (3).jpg",
      title: t("home.gemini"),
      description: t("home.geminiDesc"),
      link: "/gemini",
      logo: "/geminilogo.png",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} />
      <ProductShowcase products={productLines} />
      <TrainingBanner />
      <ReasonsToTrain />
      <FeaturedProducts />
      <AsSeenIn />
      <NailPolishDisplay />
    </>
  );
}

