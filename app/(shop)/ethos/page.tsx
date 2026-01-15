"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { HeroSlider } from "@/components/layout/hero-slider";
import { IngredientSlider } from "@/components/product/ingredient-slider";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import TextGenerateEffect from "@/components/ui/text-generate-effect";
import { Pagination } from "@/components/ui/pagination";
import { useLanguage } from "@/contexts/language-context";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  images?: string[];
  featured: boolean;
  rating?: number;
  reviewCount?: number;
  category: {
    id: string;
    name: string;
  } | null;
}

export default function EthosPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [isScrolling, setIsScrolling] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  const slides = [
    {
      type: "video" as const,
      src: "/1203 (1).mp4",
      overlayImage: "/ETHOSLOGO.png",
    },
  ];

  useEffect(() => {
    fetchEthosProducts();
  }, [currentPage]);



  // Scroll detection for text highlighting
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrollingActive = false;

    const handleScroll = () => {
      if (!isScrollingActive) {
        setIsScrolling(true);
        isScrollingActive = true;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        isScrollingActive = false;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const fetchEthosProducts = async () => {
    setIsLoading(true);
    try {
      // First, try to find an "Ethos" category
      const categoriesRes = await fetch("/api/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        const ethosCategory = categoriesData.categories?.find(
          (cat: { name: string }) => cat.name.toLowerCase() === "ethos"
        );

        if (ethosCategory) {
          setCategoryId(ethosCategory.id);
          // If category exists, fetch all products in that category with pagination
          const res = await fetch(`/api/products?categoryId=${ethosCategory.id}&page=${currentPage}&limit=10`);
          if (res.ok) {
            const data = await res.json();
            if (data.pagination) {
              setProducts(data.products || []);
              setTotalPages(data.pagination.totalPages || 1);
            } else {
              setProducts(Array.isArray(data) ? data : data.products || []);
              setTotalPages(1);
            }
          }
        } else {
          // Otherwise, search for products with "ethos" in the name with pagination
          const res = await fetch(`/api/products?search=ethos&page=${currentPage}&limit=10`);
          if (res.ok) {
            const data = await res.json();
            if (data.pagination) {
              setProducts(data.products || []);
              setTotalPages(data.pagination.totalPages || 1);
            } else {
              setProducts(Array.isArray(data) ? data : data.products || []);
              setTotalPages(1);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Ingredients data for the slider
  const ingredients = [
    {
      id: "jojoba",
      name: "A Jojoba: Ciência e Nutrição",
      image: "/Add a heading (13).png",
      whyWeUseIt: "Porque a utilizamos? A sua estrutura de cera líquida é muito semelhante aos óleos naturais da pele, sendo por isso perfeitamente tolerada e absorvida sem deixar resíduos oleosos. Actua como um veículo de precisão, transportando nutrientes essenciais (como a Vitamina E) para o interior da placa ungueal, potenciando a saúde e regeneração da unha.",
      benefits: [],
      backgroundColor: "#ef7f28",
      textColor: "#FFFFFF"
    },
    {
      id: "almond",
      name: "Amêndoa: Nutrição e Cuidado",
      image: "/jojoba (13).png",
      whyWeUseIt: "Porque a utilizamos? Rica em vitaminas e zinco, proporciona um tratamento completo: • Fortalecimento: Unhas mais fortes e protegidas contra a quebra precoce. • Hidratação: Suaviza e amacia as cutículas para uma excelente aparência. • Nutrição: Estimula o colagénio e a queratina, essenciais na saúde natural.",
      benefits: [],
      backgroundColor: "#7b3615",
      textColor: "#FFFFFF"
    },
    {
      id: "avocado",
      name: "Abacate: Saúde e Resistência",
      image: "/dsd.png",
      whyWeUseIt: "Porque o utilizamos? Rico em biotina e vitaminas, oferece cuidados essenciais: • Fortalecimento: Unhas mais resistentes e protegidas contra a quebra. • Hidratação: Nutre profundamente as cutículas, prevenindo o ressecamento.",
      benefits: [],
      backgroundColor: "#aeb54d",
      textColor: "#FFFFFF"
    },
    {
      id: "kiwi",
      name: "Kiwi: Vitalidade e Crescimento",
      image: "/jojoba (8).png",
      whyWeUseIt: "Porque o utilizamos? Uma fonte poderosa de vitaminas e minerais para a regeneração da unha: • Fortalecimento: Nutrientes ativos que previnem a quebra e a fragilidade. • Crescimento: Estimula um desenvolvimento mais rápido, saudável e uniforme. • Resistência: Potencia o colagénio natural para unhas mais flexíveis e robustas.",
      benefits: [],
      backgroundColor: "#815532",
      textColor: "#FFFFFF"
    },
    {
      id: "passion-fruit",
      name: "Maracujá: Nutrição e Vitalidade",
      image: "/fawa.png",
      whyWeUseIt: "Porque o utilizamos? O óleo e as sementes de maracujá para um cuidado completo: • Fortalecimento: Nutre e hidrata unhas e cutículas, prevenindo a quebra. • Renovação: Remove células mortas e restaura a camada lipídica da pele. • Saúde: Mantém as cutículas macias, bem cuidadas e com um brilho natural.",
      benefits: [],
      backgroundColor: "#eba725",
      textColor: "#FFFFFF"
    },
    {
      id: "jasmine",
      name: "Lavanda: Purificação e Crescimento",
      image: "/jojoba (4).png",
      whyWeUseIt: "Porque a utilizamos? Propriedades terapêuticas que equilibram a saúde e o bem-estar das unhas: • Proteção: Ação antisséptica e anti-inflamatória que previne infeções e acalma a pele. • Circulação: Estimula o fluxo sanguíneo local, promovendo um crescimento saudável. • Vitalidade: Contribui para unhas mais flexíveis, saudáveis e com brilho natural.",
      benefits: [],
      backgroundColor: "#422e55",
      textColor: "#FFFFFF"
    },
    {
      id: "sunflower-seed",
      name: "Girassol: Regeneração e Defesa",
      image: "/jojoba (3).png",
      whyWeUseIt: "Porque o utilizamos? Um aliado poderoso na reparação profunda e proteção da unha natural: • Fortalecimento: Nutre a estrutura da unha, prevenindo quebras e rachaduras. • Ação Antifúngica: Ajuda no combate a fungos e micoses (onicomicose). • Regeneração: Repara as unhas e mantém as cutículas suaves e saudáveis.",
      benefits: [],
      backgroundColor: "#351d0c",
      textColor: "#FFFFFF",
      imageSize: "70%"
    }
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" showDarkOverlay={false} scrollControlled={true} />
      
      {/* Text Section with Scroll-Triggered Highlighting */}
      <section 
        ref={textSectionRef}
        id="our-funds"
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] bg-brand-white"
      >
        <div className="w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center">
              <TextGenerateEffect
                words={`${t("productPages.ethos.description")} #our-funds`}
                className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-brand-black leading-relaxed font-normal"
                filter={true}
                duration={0.5}
                triggerOnScroll={true}
                isScrolling={isScrolling}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Natural & Organic Ingredients Section */}
      <IngredientSlider ingredients={ingredients} />
      
      {/* Ethos Products Grid Section */}
      <section ref={productsSectionRef} className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-medium mb-12 text-center text-brand-black">
            {t("productPages.ethosProducts")}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.noEthosProducts")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    images={product.images}
                    featured={product.featured}
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

      {/* Product Reviews Section */}
      <ProductReviews categoryId={categoryId} />

      {/* Full Width Video Background Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Lavender Base (2).mp4" type="video/mp4" />
        </video>
      </section>

    </>
  );
}

