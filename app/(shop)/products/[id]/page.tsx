"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductHeaderLayout } from "@/components/product/product-header-layout";

interface AttributeValue {
  value: string;
  price?: number | null;
  images?: string[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  images: string[];
  attributes?: Record<string, AttributeValue[] | string[]>;
  category: {
    id: string;
    name: string;
  } | null;
  rating?: number;
  reviewCount?: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [displayPrice, setDisplayPrice] = useState<string>("0");
  const [displayImages, setDisplayImages] = useState<string[]>([]);

  const updateDisplayValues = useCallback(
    (productData: Product, selections: Record<string, string>) => {
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

        if (selectedAttr && typeof selectedAttr === "object" && selectedAttr !== null) {
          const attr = selectedAttr as AttributeValue;
          if (category.toLowerCase() === "size" && attr.price != null && attr.price !== 0) {
            price = attr.price.toString();
          }
          if (attr.images?.length) {
            attributeImages =
              category.toLowerCase() === "size"
                ? [...attr.images, ...attributeImages]
                : [...attributeImages, ...attr.images];
          }
        }
      });

      setDisplayPrice(price);
      setDisplayImages([...attributeImages, ...backupImages]);
    },
    []
  );

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${params.id}`);
      if (res.ok) {
        const data = await res.json();
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
          const backupImages = data.image
            ? [data.image, ...(data.images || [])]
            : data.images || [];
          setDisplayImages(backupImages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, updateDisplayValues]);

  const fetchRelatedProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${params.id}/related`);
      if (res.ok) {
        const data = await res.json();
        setRelatedProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch related products:", error);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchRelatedProducts();
    }
  }, [params.id, fetchProduct, fetchRelatedProducts]);

  const handleAttributeSelect = (category: string, value: string) => {
    const newSelections = { ...selectedAttributes, [category]: value };
    setSelectedAttributes(newSelections);
    if (product) updateDisplayValues(product, newSelections);
  };

  const addToCart = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${params.id}`)}`);
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      const ok = await addItem(product.id, quantity);
      if (ok) {
        window.dispatchEvent(new CustomEvent("openCartDrawer"));
      } else {
        toast(
          language === "pt"
            ? "Não foi possível adicionar ao carrinho."
            : "Could not add to cart.",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${params.id}`)}`);
      return;
    }
    if (!product) return;

    setIsAdding(true);
    try {
      const ok = await addItem(product.id, quantity);
      if (ok) router.push("/checkout");
      else {
        toast(
          language === "pt"
            ? "Não foi possível adicionar ao carrinho."
            : "Could not add to cart.",
          "error"
        );
      }
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
    {
      title: language === "pt" ? "Loja" : "Shop all",
      href: "/products",
    },
    ...(product.category
      ? [{ title: product.category.name, href: `/products?categoryId=${product.category.id}` }]
      : []),
    { title: product.name, href: `/products/${product.id}` },
  ];

  const shippingTabText =
    language === "pt"
      ? "Envio grátis em encomendas acima de 150€. Entrega rápida e fiável em Portugal."
      : "Free shipping on orders over €150. Fast, reliable delivery across Portugal.";

  const returnsTabText =
    language === "pt"
      ? "Consulte a nossa política de devoluções e reembolsos na página Termos e Devoluções."
      : "See our returns and refund policy on the Terms and Returns page.";

  return (
    <div className="min-h-screen bg-white">
      <ProductHeaderLayout
        productName={product.name}
        descriptionHtml={product.description}
        detailsTabHtml={product.description}
        priceLabel={formatPrice(displayPrice)}
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

      <div className="px-4 pb-16 sm:px-[5%] sm:pb-20">
        <div className="mx-auto max-w-[1920px] border-t border-gray-200 pt-12">
          <ProductReviews productId={product.id} />
        </div>

        {relatedProducts.length > 0 && (
          <div className="mx-auto mt-16 max-w-[1920px] border-t border-gray-200 pt-12">
            <h2 className="mb-8 text-2xl font-light text-brand-black lg:text-3xl">
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
            <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={String(relatedProduct.price)}
                  image={relatedProduct.image}
                  images={relatedProduct.images || []}
                  description={relatedProduct.description}
                  outOfStock={(relatedProduct as { outOfStock?: boolean }).outOfStock}
                  hemaFree={(relatedProduct as { hemaFree?: boolean }).hemaFree}
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
