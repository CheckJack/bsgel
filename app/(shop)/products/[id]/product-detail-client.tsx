"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductHeaderLayout } from "@/components/product/product-header-layout";
import { productPath } from "@/lib/products/paths";
import { findCategoryByBrandSlug } from "@/lib/brand-lines";

const NAIL_CARE_FLIPBOOK_SRC = "https://heyzine.com/flip-book/1f3bd82134.html";

interface AttributeValue {
  value: string;
  price?: number | null;
  images?: string[];
}

export interface ProductDetailData {
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images: string[];
  attributes?: Record<string, AttributeValue[] | string[]>;
  category: {
    id: string;
    name: string;
    slug?: string | null;
  } | null;
  rating?: number;
  reviewCount?: number;
  outOfStock?: boolean;
  hemaFree?: boolean;
}

type ProductDetailClientProps = {
  initialProduct?: ProductDetailData | null;
  paramKey: string;
};

export function ProductDetailClient({
  initialProduct = null,
  paramKey,
}: ProductDetailClientProps) {
  const routeKey = String(paramKey || "");
  const { data: session } = useSession();
  const { addItemDetailed } = useCart();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<ProductDetailData | null>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetailData[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [displayPrice, setDisplayPrice] = useState<string>(initialProduct?.price || "0");
  const [displayImages, setDisplayImages] = useState<string[]>(
    initialProduct
      ? initialProduct.image
        ? [initialProduct.image, ...(initialProduct.images || [])]
        : initialProduct.images || []
      : []
  );

  const updateDisplayValues = useCallback(
    (productData: ProductDetailData, selections: Record<string, string>) => {
      const backupImages = productData.image
        ? [productData.image, ...(productData.images || [])]
        : productData.images || [];

      if (!productData.attributes || typeof productData.attributes !== "object") {
        setDisplayPrice(productData.price || "0");
        setDisplayImages(backupImages);
        return;
      }

      const attrs = productData.attributes as Record<string, unknown>;
      let price = productData.price || "0";
      let attributeImages: string[] = [];

      Object.entries(selections).forEach(([category, selectedValue]) => {
        const categoryValues = attrs[category];
        if (!Array.isArray(categoryValues)) return;

        const selectedAttr = categoryValues.find((v: unknown) => {
          const value = typeof v === "string" ? v : (v as AttributeValue).value;
          return value === selectedValue;
        });

        if (!selectedAttr || typeof selectedAttr === "string") return;
        const attr = selectedAttr as AttributeValue;
        if (attr.price != null) price = String(attr.price);
        if (Array.isArray(attr.images) && attr.images.length > 0) {
          attributeImages = attr.images;
        }
      });

      setDisplayPrice(price);
      setDisplayImages(attributeImages.length > 0 ? attributeImages : backupImages);
    },
    []
  );

  const applyProduct = useCallback(
    (data: ProductDetailData) => {
      setProduct(data);
      if (data.attributes && typeof data.attributes === "object") {
        const attrs = data.attributes as Record<string, unknown>;
        const initialSelections: Record<string, string> = {};
        Object.entries(attrs).forEach(([category, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            const firstValue =
              typeof values[0] === "string" ? values[0] : (values[0] as AttributeValue).value;
            if (firstValue) initialSelections[category] = firstValue;
          }
        });
        setSelectedAttributes(initialSelections);
        updateDisplayValues(data, initialSelections);
      } else {
        setDisplayPrice(data.price || "0");
        setDisplayImages(
          data.image ? [data.image, ...(data.images || [])] : data.images || []
        );
      }
    },
    [updateDisplayValues]
  );

  useEffect(() => {
    if (!routeKey) return;

    let cancelled = false;

    const run = async () => {
      if (initialProduct?.id) {
        applyProduct(initialProduct);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(routeKey)}`);
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) applyProduct(data);
          }
        } catch (error) {
          console.error("Failed to fetch product:", error);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      try {
        const res = await fetch(`/api/products/${encodeURIComponent(routeKey)}/related`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRelatedProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [routeKey, initialProduct, applyProduct]);

  const handleAttributeSelect = (category: string, value: string) => {
    const newSelections = { ...selectedAttributes, [category]: value };
    setSelectedAttributes(newSelections);
    if (product) updateDisplayValues(product, newSelections);
  };

  const storePath = product ? productPath(product) : productPath(routeKey);

  const addToCart = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(storePath)}`);
      return;
    }
    if (!product) return;
    setIsAdding(true);
    try {
      const result = await addItemDetailed(product.id, quantity);
      if (result === "ok" || result === "partial") {
        window.dispatchEvent(new CustomEvent("openCartDrawer"));
      } else if (result === "blocked") {
        toast(t("cart.addFailedRetry"), "error");
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(storePath)}`);
      return;
    }
    if (!product) return;
    setIsAdding(true);
    try {
      const result = await addItemDetailed(product.id, quantity);
      if (result === "ok" || result === "partial") router.push("/checkout");
      else if (result === "blocked") toast(t("cart.addFailedRetry"), "error");
    } catch (error) {
      console.error("Failed to buy now:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const layoutAttributes = useMemo(() => {
    if (!product?.attributes || typeof product.attributes !== "object") return {};
    const attrs = product.attributes as Record<string, unknown>;
    const result: Record<string, Array<{ value: string; disabled?: boolean }>> = {};
    Object.entries(attrs).forEach(([category, values]) => {
      if (!Array.isArray(values) || values.length === 0) return;
      result[category] = values.map((v: unknown) => ({
        value: typeof v === "string" ? v : (v as AttributeValue).value,
        disabled: false,
      }));
    });
    return result;
  }, [product?.attributes]);

  const labels = useMemo(
    () =>
      language === "pt"
        ? {
            select: "Selecionar",
            variant: "Variante",
            addToCart: "Adicionar ao carrinho",
            buyNow: "Comprar agora",
            details: "Detalhes",
            catalogue: "Catálogo",
            shipping: "Envio",
            returns: "Devoluções",
            reviews: "avaliações",
            review: "avaliação",
            stars: "estrelas",
          }
        : {
            select: "Select",
            variant: "Variant",
            addToCart: "Add to cart",
            buyNow: "Buy now",
            details: "Details",
            catalogue: "Catalogue",
            shipping: "Shipping",
            returns: "Returns",
            reviews: "reviews",
            review: "review",
            stars: "stars",
          },
    [language]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white text-gray-600">
        {t("home.loadingProducts")}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white text-brand-black">
        {language === "pt" ? "Produto não encontrado" : "Product not found"}
      </div>
    );
  }

  const images =
    displayImages.length > 0
      ? displayImages
      : product.image
        ? [product.image, ...product.images]
        : product.images;

  const breadcrumbs = [
    { title: language === "pt" ? "Loja" : "Shop all", href: "/products" },
    ...(product.category
      ? [{ title: product.category.name, href: `/products?categoryId=${product.category.id}` }]
      : []),
    { title: product.name, href: productPath(product) },
  ];

  const shippingTabText =
    language === "pt"
      ? "Envio grátis em encomendas acima de 150€. Entrega rápida e fiável em Portugal."
      : "Free shipping on orders over €150. Fast, reliable delivery across Portugal.";

  const returnsTabText =
    language === "pt"
      ? "Consulte a nossa política de devoluções e reembolsos na página Termos e Devoluções."
      : "See our returns and refund policy on the Terms and Returns page.";

  const isNailCareProduct = Boolean(
    product.category &&
      findCategoryByBrandSlug(
        [{ slug: product.category.slug, name: product.category.name }],
        "ethos"
      )
  );

  const nailCareFlipbook = isNailCareProduct ? (
    <div className="w-full">
      <iframe
        title={language === "pt" ? "Catálogo Cuidados das Unhas" : "Nail Care catalogue"}
        allowFullScreen
        allow="autoplay; fullscreen; clipboard-write"
        scrolling="no"
        className="fp-iframe w-full"
        style={{ border: "1px solid lightgray", width: "100%", height: 400 }}
        src={NAIL_CARE_FLIPBOOK_SRC}
      />
    </div>
  ) : undefined;

  return (
    <div className="min-h-screen bg-white">
      <ProductHeaderLayout
        productName={product.name}
        descriptionHtml={product.description}
        detailsTabHtml={product.description}
        catalogueTabContent={nailCareFlipbook}
        priceLabel={formatPrice(product.salePrice || displayPrice)}
        originalPriceLabel={
          product.salePrice && product.salePrice !== displayPrice
            ? formatPrice(displayPrice)
            : undefined
        }
        rating={product.rating ?? 0}
        reviewCount={product.reviewCount ?? 0}
        images={images}
        categoryName={product.category?.name ?? null}
        categoryId={product.category?.id ?? null}
        breadcrumbs={breadcrumbs}
        attributes={layoutAttributes}
        selectedAttributes={selectedAttributes}
        onAttributeSelect={handleAttributeSelect}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={addToCart}
        onBuyNow={handleBuyNow}
        isAdding={isAdding}
        freeShippingNote={
          language === "pt"
            ? "Envio grátis em encomendas acima de 150€"
            : "Free shipping on orders over €150"
        }
        shippingTabText={shippingTabText}
        returnsTabText={returnsTabText}
        labels={labels}
      />

      <div className="px-4 pb-16 sm:px-[5%] sm:pb-20 md:pb-24">
        <div className="mx-auto max-w-[1920px] pt-10 md:pt-12 lg:pt-14">
          <ProductReviews productId={product.id} />
        </div>

        {relatedProducts.length > 0 && (
          <div className="mx-auto mt-12 max-w-[1920px] border-t border-gray-200 pt-10 md:mt-16 md:pt-12">
            <h2 className="mb-6 text-2xl font-light text-brand-black md:mb-8 md:text-[1.75rem] lg:text-3xl">
              {(() => {
                if (product.category?.id) {
                  const sameCategoryCount = relatedProducts.filter(
                    (p) => p.category?.id === product.category?.id
                  ).length;
                  if (sameCategoryCount >= Math.ceil(relatedProducts.length / 2)) {
                    return language === "pt" ? "Produtos relacionados" : "Related Products";
                  }
                }
                return language === "pt" ? "Também pode gostar" : "You May Also Like";
              })()}
            </h2>
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  slug={relatedProduct.slug}
                  name={relatedProduct.name}
                  price={String(relatedProduct.price)}
                  image={relatedProduct.image}
                  images={relatedProduct.images || []}
                  description={relatedProduct.description}
                  outOfStock={relatedProduct.outOfStock}
                  hemaFree={relatedProduct.hemaFree}
                  rating={relatedProduct.rating}
                  reviewCount={relatedProduct.reviewCount}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
