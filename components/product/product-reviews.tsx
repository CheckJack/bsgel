"use client";

import { useState } from "react";
import { Star, CheckCircle2, Globe, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  title?: string;
  content: string;
  productName: string;
  date: string;
  verifiedBuyer: boolean;
  companyResponse?: string;
  helpfulCount: number;
  notHelpfulCount: number;
}

interface ReviewsProps {
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

export function ProductReviews({ overallRating = 4.6, totalReviews = 127587, reviews }: ReviewsProps) {
  const [activeTab, setActiveTab] = useState<"site" | "product">("product");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("most-recent");
  const reviewsPerPage = 5;

  // Mock data - replace with actual data from props or API
  const mockReviews: Review[] = reviews || [
    {
      id: "1",
      reviewerName: "Ana S.",
      rating: 5,
      content: "❤️❤️",
      productName: "Sparks",
      date: "03/12/25",
      verifiedBuyer: true,
      companyResponse: undefined,
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: "2",
      reviewerName: "Sofia M.",
      rating: 5,
      title: "Macio e confortável",
      content: "Macio e confortável. A textura delicada realmente faz a diferença para uma preparação confortável das unhas.",
      productName: "Lima Preparadora",
      date: "03/12/25",
      verifiedBuyer: true,
      companyResponse: "Muito obrigada pelo seu feedback sobre a nossa Lima Preparadora! A textura delicada realmente faz a diferença para uma preparação confortável das unhas. ✨",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: "3",
      reviewerName: "Carla P.",
      rating: 5,
      title: "Espetacular!!! Uma cor vibrante e",
      content: "Espetacular!!! Uma cor vibrante e profunda, muito particular. Eu também a definiria como perfeita para festas de inverno.",
      productName: "Poison",
      date: "03/12/25",
      verifiedBuyer: true,
      companyResponse: "Muito obrigada pelo seu feedback! Ficamos felizes que tenha gostado do Poison. ✨",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: "4",
      reviewerName: "Mariana R.",
      rating: 5,
      content: "Cor adorável.\nCor de longa duração.",
      productName: "Clay",
      date: "03/12/25",
      verifiedBuyer: true,
      companyResponse: "Muito obrigada pelo seu feedback sobre a nossa cor Clay! Ficamos felizes que ela dure tanto e que você goste tanto. ✨💅",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: "5",
      reviewerName: "Beatriz L.",
      rating: 5,
      title: "Ótimo para arrumações eficazes",
      content: "Ótimo para arrumações eficazes. Realmente facilita muito a limpeza e deixa tudo mais preciso.",
      productName: "Caneta Corretora de Esmalte",
      date: "03/12/25",
      verifiedBuyer: true,
      companyResponse: "Muito obrigada pelo seu feedback sobre a nossa Caneta Corretora de Esmalte! Ela realmente facilita muito a limpeza e deixa tudo mais preciso. ✨💅",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
  ];

  // Calculate breakdown
  const breakdown = [
    { stars: 5, count: 102942 },
    { stars: 4, count: 13274 },
    { stars: 3, count: 4499 },
    { stars: 2, count: 2426 },
    { stars: 1, count: 4446 },
  ];

  const displayedReviews = mockReviews;
  const totalPages = Math.ceil(displayedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = displayedReviews.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return dateString;
  };

  return (
    <section className="relative w-full bg-white py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Centered Top Section */}
        <div className="flex flex-col items-center mb-8">
          {/* Trustpilot Banner */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl font-semibold text-gray-800">Excelente</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-pink-500 text-pink-500" />
              ))}
            </div>
            <span className="text-sm text-gray-600">Trustpilot</span>
          </div>

          {/* Overall Rating Section */}
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-gray-900">{overallRating}</div>
                <StarRating rating={overallRating} size="lg" />
              </div>
              <div className="text-sm text-gray-600">
                Com base em {totalReviews.toLocaleString()} avaliações
              </div>
            </div>
            
            <div className="w-full min-w-[280px] max-w-md mx-auto md:mx-0">
              <RatingBreakdown totalReviews={totalReviews} breakdown={breakdown} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("site")}
            className={`pb-4 px-2 font-medium ${
              activeTab === "site"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Avaliações do Site
          </button>
          <button
            onClick={() => setActiveTab("product")}
            className={`pb-4 px-2 font-medium ${
              activeTab === "product"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Avaliações de Produtos
          </button>
        </div>

        {/* Sort By */}
        <div className="flex justify-end mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="most-recent">Mais recentes</option>
            <option value="highest-rated">Melhor avaliados</option>
            <option value="lowest-rated">Pior avaliados</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-8">
          {paginatedReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{review.reviewerName}</span>
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
                <h4 className="text-lg font-medium text-gray-900 mb-2">{review.title}</h4>
              )}

              <div className="text-gray-700 mb-3 whitespace-pre-line">{review.content}</div>

              <div className="text-sm text-gray-600 mb-3">
                Produto Avaliado: <span className="font-medium">{review.productName}</span>
              </div>

              {review.companyResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-brand-champagne flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <span className="font-semibold text-gray-900">La teaM</span>
                  </div>
                  <p className="text-gray-700">{review.companyResponse}</p>
                  <button className="mt-2 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                    <Globe className="w-4 h-4" />
                    <span>Traduzir para Inglês</span>
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Esta avaliação foi útil para você?</span>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{review.helpfulCount}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm">{review.notHelpfulCount}</span>
                    </button>
                  </div>
                </div>
                {!review.companyResponse && (
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                    <Globe className="w-4 h-4" />
                    <span>Traduzir para Inglês</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

