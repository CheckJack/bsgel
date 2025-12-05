import { HeroSlider } from "@/components/layout/hero-slider";
import { CategoryBanner } from "@/components/layout/category-banner";
import { TrainingBanner } from "@/components/layout/training-banner";
import { ReasonsToTrain } from "@/components/layout/reasons-to-train";
import { AsSeenIn } from "@/components/layout/as-seen-in";
import { NailPolishDisplay } from "@/components/layout/nail-polish-display";

export default function Home() {
  const slides = [
    {
      type: "video" as const,
      src: "/moodywo4.mp4",
      overlayImage: "/MoodyJewels.png",
    },
    {
      type: "video" as const,
      src: "/buildervid.mp4",
      overlayImage: "/builderg.png",
    },
  ];

  const categories = [
    {
      image: "/Cuticle Oils (1).jpg",
      text: "TRAINING AND KITS",
      link: "/training",
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
      text: "elim",
      link: "/elim",
      textPosition: "center" as const,
      textCase: "lowercase" as const,
    },
    {
      image: "/SPA - Apricot Kernel Scrub  (21) (1).jpg",
      text: "tint.",
      link: "/tint",
      textPosition: "bottom-left" as const,
      textCase: "lowercase" as const,
    },
    {
      image: "/316 A Breath of Fresh Air - Creative (3).jpg",
      text: "Category 5",
      link: "/category5",
      textPosition: "center" as const,
      textCase: "uppercase" as const,
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} />
      <CategoryBanner categories={categories} />
      <TrainingBanner />
      <ReasonsToTrain />
      <AsSeenIn />
      <NailPolishDisplay />
    </>
  );
}

