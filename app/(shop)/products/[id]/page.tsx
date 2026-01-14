"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { useLanguage } from "@/contexts/language-context";
import DOMPurify from "isomorphic-dompurify";

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

function StarRating({ rating = 4.5 }: { rating?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const decimal = rating % 1;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return (
            <Star 
              key={i} 
              className="h-6 w-6 fill-brand-champagne text-brand-champagne transition-all duration-200" 
            />
          );
        } else if (i === fullStars && hasHalfStar) {
          const fillPercentage = Math.round(decimal * 100);
          return (
            <div key={i} className="relative h-6 w-6">
              <Star className="h-6 w-6 text-gray-300 absolute inset-0" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
                <Star className="h-6 w-6 fill-brand-champagne text-brand-champagne" />
              </div>
            </div>
          );
        } else {
          return (
            <Star 
              key={i} 
              className="h-6 w-6 text-gray-300 fill-gray-100 transition-all duration-200" 
            />
          );
        }
      })}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const router = useRouter();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [displayPrice, setDisplayPrice] = useState<string>("0");
  const [displayImages, setDisplayImages] = useState<string[]>([]);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        
        // Initialize selected attributes and display values
        if (data.attributes && typeof data.attributes === 'object') {
          const attrs = data.attributes as Record<string, any>;
          const initialSelections: Record<string, string> = {};
          
          // For each attribute category, select the first value by default
          Object.entries(attrs).forEach(([category, values]) => {
            if (Array.isArray(values) && values.length > 0) {
              const firstValue = typeof values[0] === 'string' ? values[0] : values[0].value;
              if (firstValue) {
                initialSelections[category] = firstValue;
              }
            }
          });
          
          setSelectedAttributes(initialSelections);
          updateDisplayValues(data, initialSelections);
        } else {
          // No attributes, use base price and backup images
          setDisplayPrice(data.price || "0");
          const backupImages = data.image ? [data.image, ...(data.images || [])] : (data.images || []);
          setDisplayImages(backupImages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const updateDisplayValues = (productData: Product, selections: Record<string, string>) => {
    // Get backup images (main product images)
    const backupImages = productData.image ? [productData.image, ...(productData.images || [])] : (productData.images || []);
    
    if (!productData.attributes || typeof productData.attributes !== 'object') {
      setDisplayPrice(productData.price || "0");
      setDisplayImages(backupImages);
      return;
    }

    const attrs = productData.attributes as Record<string, any>;
    let price = productData.price || "0";
    let attributeImages: string[] = [];

    // Get values for selected attributes - prioritize size attribute
    Object.entries(selections).forEach(([category, selectedValue]) => {
      const categoryValues = attrs[category];
      if (Array.isArray(categoryValues)) {
        const selectedAttr = categoryValues.find((v: any) => {
          const value = typeof v === 'string' ? v : v.value;
          return value === selectedValue;
        });

        if (selectedAttr) {
          // If it's the new format with price and images
          if (typeof selectedAttr === 'object' && selectedAttr.price !== undefined) {
            // For size attribute, use its price
            if (category.toLowerCase() === 'size') {
              if (selectedAttr.price !== null && selectedAttr.price !== 0) {
                price = selectedAttr.price.toString();
              }
            }
            // Collect images from all selected attributes (prioritize size)
            if (selectedAttr.images && selectedAttr.images.length > 0) {
              if (category.toLowerCase() === 'size') {
                // Size images go first
                attributeImages = [...selectedAttr.images, ...attributeImages];
              } else {
                // Other attribute images go after size
                attributeImages = [...attributeImages, ...selectedAttr.images];
              }
            }
          }
        }
      }
    });

    // Combine: attribute-specific images first, then backup images
    const allImages = [...attributeImages, ...backupImages];

    setDisplayPrice(price);
    setDisplayImages(allImages);
  };

  const handleAttributeSelect = (category: string, value: string) => {
    const newSelections = { ...selectedAttributes, [category]: value };
    setSelectedAttributes(newSelections);
    if (product) {
      updateDisplayValues(product, newSelections);
    }
  };

  const fetchRelatedProducts = useCallback(async () => {
    setIsLoadingRelated(true);
    try {
      const res = await fetch(`/api/products/${params.id}/related`);
      if (res.ok) {
        const data = await res.json();
        setRelatedProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch related products:", error);
    } finally {
      setIsLoadingRelated(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchRelatedProducts();
    }
  }, [params.id, fetchProduct, fetchRelatedProducts]);

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!product) return;

    setIsAdding(true);
    try {
      await addItem(product.id, quantity);
      // Dispatch custom event to open cart drawer
      window.dispatchEvent(new CustomEvent("openCartDrawer"));
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-8 text-center">Product not found</div>;
  }

  const images = displayImages.length > 0 ? displayImages : (product.image ? [product.image, ...product.images] : product.images);

  // Function to detect if a URL is a video
  const isVideo = (url: string) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith('data:video/');
  };

  return (
    <div className="bg-brand-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16">
          {/* Left Side - All Images in Square Format (Scrollable) */}
          <div className="space-y-4 sm:space-y-6">
            {images.length > 0 ? (
              images.map((image, index) => (
                <div key={index} className="relative aspect-square bg-[#F5F3F0] rounded-lg overflow-hidden">
                  {isVideo(image) ? (
                    <video
                      src={image}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      loop
                      autoPlay={index === 0}
                      preload={index === 0 ? "auto" : "metadata"}
                    />
                  ) : (
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      priority={index === 0}
                      loading={index === 0 ? undefined : "lazy"}
                      unoptimized={image?.startsWith('data:') || image?.startsWith('blob:') || !image?.startsWith('http')}
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="relative aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* Right Side - Product Details (Sticky) */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="flex flex-col">
              {/* Category */}
              {product.category && (
                <p className="text-sm text-brand-champagne mb-3 uppercase tracking-wide">
                  {product.category.name}
                </p>
              )}

              {/* Product Heading */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-brand-black mb-4">
                {product.name}
              </h1>

              {/* Rating and Review Count */}
              {(product.rating && product.rating > 0) || (product.reviewCount && product.reviewCount > 0) ? (
                <div className="flex items-center gap-3 mb-6">
                  {product.rating && product.rating > 0 && (
                    <StarRating rating={product.rating} />
                  )}
                  {product.reviewCount && product.reviewCount > 0 && (
                    <span className="text-sm text-gray-600">
                      {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  )}
                </div>
              ) : null}

              {/* Product Name/Type */}
              <h2 className="text-lg sm:text-xl font-medium text-brand-black mb-4">
                {product.name.split(' ').slice(-2).join(' ')}
              </h2>

              {/* Description */}
              {product.description && (
                <div 
                  className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(product.description, {
                      ALLOWED_TAGS: [
                        "p",
                        "br",
                        "strong",
                        "em",
                        "u",
                        "s",
                        "h1",
                        "h2",
                        "h3",
                        "h4",
                        "h5",
                        "h6",
                        "ul",
                        "ol",
                        "li",
                        "blockquote",
                        "a",
                        "img",
                        "code",
                        "pre",
                        "hr",
                        "div",
                        "span",
                        "mark",
                      ],
                      ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel"],
                    }),
                  }}
                />
              )}

              {/* Attributes Selection */}
              {product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0 && (
                <div className="mb-6 space-y-4">
                  {Object.entries(product.attributes).map(([category, values]) => {
                    if (!Array.isArray(values) || values.length === 0) return null;
                    
                    const selectedValue = selectedAttributes[category] || (typeof values[0] === 'string' ? values[0] : values[0].value);
                    
                    return (
                      <div key={category}>
                        <label className="block text-sm font-medium text-brand-black mb-2 capitalize">
                          {category}:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {values.map((attr: any) => {
                            const value = typeof attr === 'string' ? attr : attr.value;
                            const isSelected = selectedValue === value;
                            
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleAttributeSelect(category, value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                                  isSelected
                                    ? "border-brand-champagne bg-brand-champagne/10 text-brand-black"
                                    : "border-gray-300 text-gray-700 hover:border-brand-champagne"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price and Add to Cart Section */}
              <Card className="border-gray-200 bg-brand-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <label htmlFor="quantity" className="font-medium text-brand-black text-sm sm:text-base">
                      Quantity:
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="border-brand-champagne text-brand-champagne hover:bg-brand-champagne hover:text-brand-white h-9 w-9 sm:h-10 sm:w-10"
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center border-gray-200 text-sm sm:text-base"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        className="border-brand-champagne text-brand-champagne hover:bg-brand-champagne hover:text-brand-white h-9 w-9 sm:h-10 sm:w-10"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <span className="text-base sm:text-lg font-medium text-brand-black">Total:</span>
                    <span className="text-2xl sm:text-3xl font-semibold text-brand-black">
                      {formatPrice(parseFloat(displayPrice) * quantity)}
                    </span>
                  </div>
                  <Button
                    className="w-full bg-brand-black hover:bg-brand-black/90 text-brand-white py-4 sm:py-6 text-base sm:text-lg font-medium rounded"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                  >
                    {isAdding ? t("products.adding") : t("products.addToCart")}
                  </Button>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <Image
                      src="/maestro-61c41725.svg"
                      alt="Maestro"
                      width={40}
                      height={25}
                      className="h-5 w-auto"
                      unoptimized
                      priority={false}
                    />
                    <Image
                      src="/paypal-a7c68b85.svg"
                      alt="PayPal"
                      width={40}
                      height={25}
                      className="h-5 w-auto"
                      unoptimized
                      priority={false}
                    />
                    <Image
                      src="/master-54b5a7ce.svg"
                      alt="Mastercard"
                      width={40}
                      height={25}
                      className="h-5 w-auto"
                      unoptimized
                      priority={false}
                    />
                    <Image
                      src="/visa-65d650f7.svg"
                      alt="Visa"
                      width={40}
                      height={25}
                      className="h-5 w-auto"
                      unoptimized
                      priority={false}
                    />
                    <Image
                      src="/google_pay-34c30515 (1).svg"
                      alt="Google Pay"
                      width={40}
                      height={25}
                      className="h-5 w-auto"
                      unoptimized
                      priority={false}
                    />
                    <Image
                      src="/apple_pay-1721ebad (1).svg"
                      alt="Apple Pay"
                      width={40}
                      height={25}
                      className="h-5 w-auto"
                      unoptimized
                      priority={false}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Product Reviews Section */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <ProductReviews productId={product.id} />
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200">
            <h2 className="text-2xl lg:text-3xl font-medium text-brand-black mb-8">
              {(() => {
                // Check if most products are from the same category as current product
                if (product?.category?.id) {
                  const categoryId = product.category.id;
                  const sameCategoryCount = relatedProducts.filter(
                    (p) => p.category?.id === categoryId
                  ).length;
                  // If at least half are from same category, show "Related Products"
                  if (sameCategoryCount >= Math.ceil(relatedProducts.length / 2)) {
                    return "Related Products";
                  }
                }
                // Default to "You May Also Like" for frequently bought together or mixed results
                return "You May Also Like";
              })()}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={String(relatedProduct.price)}
                  image={relatedProduct.image}
                  images={relatedProduct.images || []}
                  description={relatedProduct.description}
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

