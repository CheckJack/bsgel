"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";

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
  { title: string; hero: string; showcasingSection: string }
> = {
  "bases": { title: "Bases", hero: "/bases-hero-custom.png", showcasingSection: "bases" },
  "builders": { title: "Builders", hero: "/builders-hero-custom.png", showcasingSection: "builders" },
  "softs": { title: "Softs", hero: "/softs-hero-custom.png", showcasingSection: "softs" },
  "extensao": { title: "Extensão", hero: "/extensao-hero.svg", showcasingSection: "extensao" },
  "bundles": { title: "Bundles", hero: "/bundles-hero.svg", showcasingSection: "bundles" },
  "eletronicos": { title: "Eletrónicos", hero: "/eletronicos-hero.svg", showcasingSection: "eletronicos" },
  "promocoes": { title: "Promoções", hero: "/promocoes-hero.svg", showcasingSection: "promocoes" },
  "kits-treino": { title: "Kits e Treino", hero: "/kits-e-treino-hero.svg", showcasingSection: "kits-treino" },
  "solventes": { title: "Solventes", hero: "/solventes-hero.svg", showcasingSection: "solventes" },
  "nail-art": { title: "Nail Art", hero: "/nail-art-hero.svg", showcasingSection: "nail-art" },
  "tips": { title: "Tips", hero: "/tips-hero.svg", showcasingSection: "tips" },
  "utensilios": { title: "Utensílios", hero: "/utensilios-hero.svg", showcasingSection: "utensilios" },
  "pinceis": { title: "Pincéis", hero: "/pinceis-hero-custom.png", showcasingSection: "pinceis" },
  "lima-buffs": { title: "Lima & Buffs", hero: "/lima-buffs-hero-custom.png", showcasingSection: "lima-buffs" },
};

export default function ShopSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const config = useMemo(() => SECTIONS[section], [section]);

  useEffect(() => {
    if (!config) return;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products?showcasingSection=${encodeURIComponent(
            config.showcasingSection
          )}&page=${currentPage}&limit=12&sortBy=${encodeURIComponent(sortBy)}`
        );
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
  }, [config, currentPage, sortBy]);

  if (!config) {
    notFound();
  }

  return (
    <>
      <section className="relative h-[36vh] w-full overflow-hidden md:h-[44vh]">
        <Image src={config.hero} alt={config.title} fill className="object-cover" priority unoptimized />
        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto flex h-full max-w-7xl items-center px-4">
            <h1
              className={`text-4xl font-medium sm:text-5xl md:text-6xl ${
                section === "pinceis" || section === "builders" || section === "bases" ? "text-black" : "text-white"
              }`}
            >
              {config.title}
            </h1>
          </div>
        </div>
      </section>

      <section id="products" className="min-h-screen bg-brand-white px-4 py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-medium text-brand-black sm:text-3xl md:text-4xl">
                {config.title} BIO Sculpture
              </h2>
              <div className="mt-3 h-1 w-16 bg-brand-champagne"></div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-brand-black">{t("shop.sortBy")}</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="newest">{t("shop.newestFirst")}</option>
                <option value="oldest">{t("shop.oldestFirst")}</option>
                <option value="price-asc">{t("shop.priceLowToHigh")}</option>
                <option value="price-desc">{t("shop.priceHighToLow")}</option>
                <option value="name-asc">{t("shop.nameAtoZ")}</option>
                <option value="name-desc">{t("shop.nameZtoA")}</option>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-600">{t("products.loadingProducts")}</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-600">{t("products.noProductsFound")}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <ProductReviews
        showcasingSection={config.showcasingSection}
        productIds={products.map((product) => product.id)}
      />
    </>
  );
}
