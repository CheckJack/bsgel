"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import mobileBasesHero from "../../../egw.png";
import mobileSoftsHero from "../../../egw1111.png";
import mobileBuildersHero from "../../../egwbfgngfn.png";
import mobilePromocoesHero from "../../../egwhfdswrs.png";
import mobileEletronicosHero from "../../../egwjgfkyfkgf.png";
import mobileUtensiliosHero from "../../../egw098.png";
import mobileSolventesHero from "../../../egw142.png";
import mobileNailArtHero from "../../../egw672.png";
import mobilePinceisHero from "../../../egw44.png";
import mobileLimaBuffsHero from "../../../egw77s.png";
import mobileTipsHero from "../../../egwhtykjrt.png";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { CategoryHeroBadge } from "@/components/layout/category-hero-badge";
import { ShopFiltersDrawer, ShopFiltersToolbar } from "@/components/shop/shop-filters";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { Pagination } from "@/components/ui/pagination";
import { useLanguage } from "@/contexts/language-context";
import { useShopFilters } from "@/hooks/use-shop-filters";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images?: string[];
  featured: boolean;
  rating?: number;
  reviewCount?: number;
}

const SECTIONS: Record<
  string,
  { title?: string; titleKey?: string; hero: string; showcasingSection: string; mobileHero?: string; heroVideo?: string }
> = {
  "bases": { title: "Bases", hero: "/bases-hero-custom.png", heroVideo: "/bases-hero.mp4", showcasingSection: "bases", mobileHero: mobileBasesHero.src },
  "builders": { titleKey: "nav.shopMenu.builders", hero: "/builders-hero-custom.png", heroVideo: "/RREHREHJTWQRQRQWRDAF7aS.mp4", showcasingSection: "builders", mobileHero: mobileBuildersHero.src },
  "softs": { title: "Softs", hero: "/softs-hero-custom.png", showcasingSection: "softs", mobileHero: mobileSoftsHero.src },
  "extensao": { title: "Extensão", hero: "/extensao-hero-custom.png", showcasingSection: "extensao", mobileHero: "/7s6rysrdtj.png" },
  "eletronicos": { title: "Eletrónicos", hero: "/eletronicos-hero-custom.png", showcasingSection: "eletronicos", mobileHero: mobileEletronicosHero.src },
  "promocoes": { title: "Promoções", hero: "/promocoes-hero-custom.png", showcasingSection: "promocoes", mobileHero: mobilePromocoesHero.src },
  "solventes": { titleKey: "nav.shopMenu.solventes", hero: "/solventes-hero-custom.png", showcasingSection: "solventes", mobileHero: mobileSolventesHero.src },
  "nail-art": { title: "Nail Art", hero: "/nail-art-hero-custom.png", showcasingSection: "nail-art", mobileHero: mobileNailArtHero.src },
  "tips": { title: "Tips", hero: "/tips-hero-custom.png", showcasingSection: "tips", mobileHero: mobileTipsHero.src },
  "utensilios": { title: "Utensílios", hero: "/utensilios-hero-custom.png", showcasingSection: "utensilios", mobileHero: mobileUtensiliosHero.src },
  "pinceis": { title: "Pincéis", hero: "/pinceis-hero-custom.png", showcasingSection: "pinceis", mobileHero: mobilePinceisHero.src },
  "lima-buffs": { title: "Lima & Buffs", hero: "/lima-buffs-hero-custom.png", showcasingSection: "lima-buffs", mobileHero: mobileLimaBuffsHero.src },
};

const SECTIONS_WITH_HOME_BADGE = new Set(["bases", "builders"]);

export default function ShopSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const filters = useShopFilters();

  const config = useMemo(() => SECTIONS[section], [section]);
  const sectionTitle = config ? (config.titleKey ? t(config.titleKey) : config.title ?? "") : "";

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  useEffect(() => {
    if (!config) return;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          showcasingSection: config.showcasingSection,
          page: currentPage.toString(),
          limit: "12",
        });
        filters.appendToSearchParams(params);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch {
        setProducts([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [config, currentPage, filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  if (!config) {
    notFound();
  }

  return (
    <>
      <section className="relative h-[36vh] w-full overflow-hidden md:h-[44vh]">
        {SECTIONS_WITH_HOME_BADGE.has(section) ? <CategoryHeroBadge /> : null}
        {config.mobileHero ? (
          <>
            <Image src={config.mobileHero} alt={sectionTitle} fill className="object-cover md:hidden" priority unoptimized />
            {config.heroVideo ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-label={sectionTitle}
                className="absolute inset-0 hidden h-full w-full object-cover md:block"
              >
                <source src={config.heroVideo} type="video/mp4" />
              </video>
            ) : (
              <Image src={config.hero} alt={sectionTitle} fill className="hidden object-cover md:block" priority unoptimized />
            )}
          </>
        ) : (
          <Image src={config.hero} alt={sectionTitle} fill className="object-cover" priority unoptimized />
        )}
      </section>

      <section id="products" className="min-h-screen bg-brand-white px-4 py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <ShopProductsTitle>{sectionTitle} BIO Sculpture</ShopProductsTitle>
            </div>
            <ShopFiltersToolbar filters={filters} />
          </div>


          {isLoading ? (
            <div className="py-16 text-center text-gray-600">{t("products.loadingProducts")}</div>
          ) : products.length === 0 ? (
            <ShopEmptyProducts
              hasActiveFilters={filters.hasActiveFilters}
              onClearFilters={() => filters.clearFilters()}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 justify-items-start gap-x-5 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-12">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    salePrice={product.salePrice}
                    image={product.image}
                    images={product.images}
                    featured={product.featured}
                    outOfStock={(product as any).outOfStock}
                    hemaFree={(product as any).hemaFree}
                    description={product.description}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <ShopFiltersDrawer filters={filters} />

      <ProductReviews
        showcasingSection={config.showcasingSection}
        productIds={products.map((product) => product.id)}
      />
    </>
  );
}
