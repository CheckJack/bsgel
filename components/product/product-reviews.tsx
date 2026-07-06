"use client";

import { useState, useEffect, useRef } from "react";
import { Star, CheckCircle2, Globe, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, Send, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  title?: string;
  content: string;
  productName: string;
  productImage?: string | null;
  productId?: string;
  date: string;
  verifiedBuyer: boolean;
  companyResponse?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  status?: string; // PENDING, APPROVED, REJECTED
  isOwnReview?: boolean; // Whether this is the current user's review
}

interface ReviewsProps {
  productId?: string;
  productIds?: string[];
  categoryId?: string;
  showcasingSection?: string;
  overallRating?: number;
  totalReviews?: number;
  reviews?: Review[];
}

const StarRating = ({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const starSize = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-3 h-3" : "w-5 h-5";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        if (star <= fullStars) {
          return (
            <Star
              key={star}
              className={`${starSize} fill-pink-500 text-pink-500`}
            />
          );
        } else if (star === fullStars + 1 && hasHalfStar) {
          return (
            <div key={star} className="relative">
              <Star className={`${starSize} fill-gray-200 text-gray-200`} />
              <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                <Star className={`${starSize} fill-pink-500 text-pink-500`} />
              </div>
            </div>
          );
        } else {
          return (
            <Star
              key={star}
              className={`${starSize} fill-gray-200 text-gray-200`}
            />
          );
        }
      })}
    </div>
  );
};

const RatingBreakdown = ({
  totalReviews,
  breakdown,
}: {
  totalReviews: number;
  breakdown: { stars: number; count: number }[];
}) => {
  const maxCount = Math.max(...breakdown.map((b) => b.count));

  return (
    <div className="space-y-2 w-full">
      {breakdown.map(({ stars, count }) => {
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        const barWidth = totalReviews > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={stars} className="flex items-center gap-3 whitespace-nowrap w-full">
            <span className="text-sm text-gray-600 w-12 shrink-0">{stars} estrela{stars > 1 ? 's' : ''}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[100px]">
              <div
                className={`h-full transition-all ${percentage > 0 ? "bg-pink-500" : "bg-gray-200"}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-20 text-right shrink-0">{count.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
};

export function ProductReviews({ 
  productId, 
  productIds,
  categoryId,
  showcasingSection,
  overallRating: initialOverallRating, 
  totalReviews: initialTotalReviews, 
  reviews: initialReviews 
}: ReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("most-recent");
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [overallRating, setOverallRating] = useState(initialOverallRating || 0);
  const [totalReviews, setTotalReviews] = useState(initialTotalReviews || 0);
  const [breakdown, setBreakdown] = useState<{ stars: number; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [translatingReviewId, setTranslatingReviewId] = useState<string | null>(null);
  const [translatedReviews, setTranslatedReviews] = useState<
    Record<string, { title?: string; content: string; companyResponse?: string }>
  >({});
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const reviewsPerPage = 5;
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(initialReviews));

  useEffect(() => {
    if (initialReviews || shouldLoad) return;

    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [initialReviews, shouldLoad]);

  useEffect(() => {
    if (initialReviews) {
      setReviews(initialReviews);
      setOverallRating(initialOverallRating || 0);
      setTotalReviews(initialTotalReviews || 0);
      return;
    }

    if (!shouldLoad) return;
    fetchReviews();
  }, [
    shouldLoad,
    sortBy,
    currentPage,
    productId,
    JSON.stringify(productIds || []),
    categoryId,
    showcasingSection,
    initialReviews,
    initialOverallRating,
    initialTotalReviews,
  ]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      let url = '';
      if (productId) {
        url = `/api/products/${productId}/reviews?page=${currentPage}&limit=${reviewsPerPage}&sortBy=${sortBy}`;
      } else {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: reviewsPerPage.toString(),
          sortBy,
        });
        if (categoryId) {
          params.set('categoryId', categoryId);
        }
        if (productIds && productIds.length > 0) {
          params.set('productIds', productIds.join(','));
        }
        if (showcasingSection) {
          params.set('showcasingSection', showcasingSection);
        }
        url = `/api/reviews?${params.toString()}`;
      }
      
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        const filterType = productId ? `Product ${productId}` : (categoryId ? `Category ${categoryId}` : `Section ${showcasingSection}`);
        console.log(`[ProductReviews] ${filterType}: Fetched ${data.reviews?.length || 0} approved reviews`);
        console.log(`[ProductReviews] Total reviews count: ${data.stats?.totalReviews || 0}`);
        setReviews(data.reviews || []);
        setOverallRating(data.stats?.overallRating || 0);
        setTotalReviews(data.stats?.totalReviews || 0);
        setBreakdown(data.stats?.breakdown || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch reviews:", errorData);
        setReviews([]);
        setOverallRating(0);
        setTotalReviews(0);
        setBreakdown([]);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      // On error, show empty state
      setReviews([]);
      setOverallRating(0);
      setTotalReviews(0);
      setBreakdown([]);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedReviews = reviews;
  const totalPages = productId 
    ? Math.ceil(totalReviews / reviewsPerPage)
    : Math.ceil(displayedReviews.length / reviewsPerPage);
  
  // For productId pages, reviews are already paginated by API
  // For category pages, we need to paginate locally
  const paginatedReviews = productId 
    ? displayedReviews 
    : displayedReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);

  const formatDate = (dateString: string) => {
    return dateString;
  };

  const handleSubmitReview = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!productId) return;

    if (reviewRating === 0) {
      setSubmitError("Please select a rating");
      return;
    }

    if (!reviewContent.trim()) {
      setSubmitError("Please write your review");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          content: reviewContent.trim(),
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setReviewRating(0);
        setReviewTitle("");
        setReviewContent("");
        setShowReviewForm(false);
        // Refresh reviews
        await fetchReviews();
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteReview = async (reviewId: string, voteType: "helpful" | "notHelpful") => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: voteType }),
      });

      if (!res.ok) return;
      const data = await res.json();

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpfulCount: data.helpfulCount ?? review.helpfulCount,
                notHelpfulCount: data.notHelpfulCount ?? review.notHelpfulCount,
              }
            : review
        )
      );
    } catch (error) {
      console.error("Falha ao registar voto da avaliação:", error);
    }
  };

  const handleTranslateReview = async (review: Review) => {
    // Toggle back to original if already translated.
    if (translatedReviews[review.id]) {
      setTranslatedReviews((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
      return;
    }

    try {
      setTranslatingReviewId(review.id);

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: [review.title || "", review.content, review.companyResponse || ""],
          target: "pt",
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const translatedTexts: string[] = Array.isArray(data.translations) ? data.translations : [];

      setTranslatedReviews((prev) => ({
        ...prev,
        [review.id]: {
          title: translatedTexts[0] || review.title || undefined,
          content: translatedTexts[1] || review.content,
          companyResponse: translatedTexts[2] || review.companyResponse || undefined,
        },
      }));
    } catch (error) {
      console.error("Falha ao traduzir avaliação:", error);
    } finally {
      setTranslatingReviewId(null);
    }
  };

  // Always render the review section - show empty state if no reviews on category pages
  return (
    <section ref={sectionRef} className="relative w-full bg-white py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Centered Top Section - Show for both product and category pages */}
        <div className="flex flex-col items-center mb-8">
          {/* Trustpilot Banner */}
          {overallRating > 0 && (
            <div className="flex items-center gap-2 mb-8">
              <span className="text-xl font-semibold text-gray-800">Excelente</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-pink-500 text-pink-500" />
                ))}
              </div>
              <span className="text-sm text-gray-600">Trustpilot</span>
            </div>
          )}

          {/* Overall Rating Section */}
          {totalReviews > 0 ? (
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
              <div className="flex flex-col gap-2 items-center">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-gray-900">{overallRating > 0 ? overallRating.toFixed(1) : '0.0'}</div>
                  <StarRating rating={overallRating || 0} size="lg" />
                </div>
                <div className="text-sm text-gray-600">
                  Com base em {totalReviews.toLocaleString()} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
                  {!productId && (categoryId || showcasingSection) && (
                    <span className="block text-xs text-gray-500 mt-1">
                      {categoryId ? 'nesta categoria' : `nesta seção`}
                    </span>
                  )}
                </div>
              </div>
              
              {breakdown.length > 0 && (
                <div className="mx-auto w-full max-w-md min-w-0 md:mx-0">
                  <RatingBreakdown 
                    totalReviews={totalReviews} 
                    breakdown={breakdown} 
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">
                {productId 
                  ? t("products.noReviewsYetProduct")
                  : t("products.noReviewsYet")}
              </p>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 mb-6 pb-4">
          <h3 className="px-2 font-medium text-gray-900">Avaliações de Produtos</h3>
        </div>

        {/* Write a Review Section - Made More Prominent */}
        {productId && (
          <div className="mb-8">
            {!showReviewForm ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Partilhe a sua experiência</h3>
                  <p className="text-sm text-gray-600">Ajude outras pessoas escrevendo uma avaliação sobre este produto</p>
                </div>
                <Button
                  onClick={() => {
                    if (!session) {
                      router.push("/login");
                      return;
                    }
                    setShowReviewForm(true);
                  }}
                  className="bg-brand-champagne hover:bg-brand-champagne/90 text-white px-6 py-2 text-base font-medium whitespace-nowrap"
                >
                  Escrever avaliação
                </Button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Escrever avaliação</h3>
                
                {submitSuccess && (
                  <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-sm">
                    Avaliação enviada com sucesso! Ficará visível após aprovação do administrador.
                  </div>
                )}

                {submitError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
                    {submitError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Classificação *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= reviewRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-title" className="block text-sm font-medium mb-2">
                      Título da avaliação (opcional)
                    </label>
                    <Input
                      id="review-title"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Dê um título à sua avaliação"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-content" className="block text-sm font-medium mb-2">
                      A sua avaliação *
                    </label>
                    <Textarea
                      id="review-content"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Partilhe a sua experiência com este produto..."
                      rows={5}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitReview}
                      disabled={isSubmitting || reviewRating === 0 || !reviewContent.trim()}
                      className="bg-brand-champagne hover:bg-brand-champagne/90 text-white"
                    >
                      {isSubmitting ? "A enviar..." : "Enviar avaliação"}
                      {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewRating(0);
                        setReviewTitle("");
                        setReviewContent("");
                        setSubmitError(null);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sort By and Refresh */}
        {productId && (
          <div className="flex justify-end items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReviews()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="most-recent">Mais recentes</option>
              <option value="highest-rated">Melhor avaliados</option>
              <option value="lowest-rated">Pior avaliados</option>
            </select>
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando avaliações...</div>
        ) : paginatedReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {productId ? "Nenhuma avaliação ainda. Seja o primeiro a avaliar!" : "Nenhuma avaliação disponível."}
          </div>
        ) : (
          <div className="space-y-8">
            {paginatedReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="flex items-start gap-4 mb-3">
                {/* Product Thumbnail */}
                {review.productImage && (
                  <Link 
                    href={review.productId ? `/products/${review.productId}` : '#'}
                    className="flex-shrink-0"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                      <Image
                        src={review.productImage}
                        alt={review.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900">{review.reviewerName}</span>
                          {review.status === "PENDING" && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                              Pendente de aprovação
                            </span>
                          )}
                          {review.verifiedBuyer && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-brand-champagne" />
                              <span className="text-xs text-gray-600">Comprador Verificado</span>
                            </div>
                          )}
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                  </div>

                  {review.title && (
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {translatedReviews[review.id]?.title || review.title}
                    </h4>
                  )}

                  <div className="text-gray-700 mb-3 whitespace-pre-line">
                    {translatedReviews[review.id]?.content || review.content}
                  </div>

                  {review.status === "PENDING" && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⏳ A sua avaliação está pendente de aprovação e ficará visível para os outros utilizadores após aprovação do administrador.
                    </div>
                  )}

                  {review.productId && (
                    <div className="text-sm text-gray-600 mb-3">
                      Produto Avaliado:{" "}
                      <Link 
                        href={`/products/${review.productId}`}
                        className="font-medium text-brand-champagne hover:underline"
                      >
                        {review.productName}
                      </Link>
                    </div>
                  )}
                  {!review.productId && (
                    <div className="text-sm text-gray-600 mb-3">
                      Produto Avaliado: <span className="font-medium">{review.productName}</span>
                    </div>
                  )}
                </div>
              </div>

              {review.companyResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-brand-champagne flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <span className="font-semibold text-gray-900">A nossa equipa</span>
                  </div>
                  <p className="text-gray-700">
                    {translatedReviews[review.id]?.companyResponse || review.companyResponse}
                  </p>
                  <button
                    onClick={() => handleTranslateReview(review)}
                    disabled={translatingReviewId === review.id}
                    className="mt-2 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    <Globe className="w-4 h-4" />
                    <span>
                      {translatingReviewId === review.id
                        ? "A traduzir..."
                        : translatedReviews[review.id]
                          ? "Ver texto original"
                          : "Traduzir para português"}
                    </span>
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Esta avaliação foi útil para si?</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVoteReview(review.id, "helpful")}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{review.helpfulCount}</span>
                    </button>
                    <button
                      onClick={() => handleVoteReview(review.id, "notHelpful")}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm">{review.notHelpfulCount}</span>
                    </button>
                  </div>
                </div>
                {!review.companyResponse && (
                  <button
                    onClick={() => handleTranslateReview(review)}
                    disabled={translatingReviewId === review.id}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    <Globe className="w-4 h-4" />
                    <span>
                      {translatingReviewId === review.id
                        ? "A traduzir..."
                        : translatedReviews[review.id]
                          ? "Ver texto original"
                          : "Traduzir para português"}
                    </span>
                  </button>
                )}
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {productId && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage === 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-brand-champagne text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => {
                setCurrentPage(Math.min(totalPages, currentPage + 1));
              }}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

