"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  image: string | null;
  images?: string[];
  featured?: boolean;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
}

const isVideo = (url: string) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith('data:video/');
};

function StarRating({ rating = 4.5 }: { rating?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="h-4 w-4 fill-pink-500 text-pink-500" />;
        } else if (i === fullStars && hasHalfStar) {
          return (
            <div key={i} className="relative h-4 w-4">
              <Star className="h-4 w-4 text-gray-300 absolute inset-0" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="h-4 w-4 fill-pink-500 text-pink-500" />
              </div>
            </div>
          );
        } else {
          return <Star key={i} className="h-4 w-4 text-gray-300" />;
        }
      })}
    </div>
  );
}

export function ProductCard({ 
  id, 
  name, 
  price, 
  image, 
  images = [], 
  featured,
  description,
  rating = 4.5,
  reviewCount = 995
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Combine image and images array, with image as first item
  const allMedia = image ? [image, ...images] : images;
  const firstMedia = allMedia[0] || null;
  const secondMedia = allMedia[1] || null;
  const hasSecondMedia = !!secondMedia;

  useEffect(() => {
    if (isHovered && videoRef.current && isVideo(secondMedia || '')) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, secondMedia]);

  return (
    <div 
      className="flex flex-col h-full bg-white overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image - Full size square */}
      <Link href={`/products/${id}`} className="relative w-full aspect-square bg-[#F5F3F0] overflow-hidden">
        {firstMedia ? (
          <>
            {/* First media (always visible) */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered && hasSecondMedia ? 'opacity-0' : 'opacity-100'}`}>
              {isVideo(firstMedia) ? (
                <video
                  src={firstMedia}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay={!hasSecondMedia}
                  preload="metadata"
                />
              ) : (
                <Image
                  src={firstMedia}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              )}
            </div>
            
            {/* Second media (fades in on hover) */}
            {hasSecondMedia && (
              <div className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                {isVideo(secondMedia) ? (
                  <video
                    ref={videoRef}
                    src={secondMedia}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={secondMedia}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        {featured && (
          <div className="absolute top-3 right-3 bg-brand-champagne text-white text-xs px-2 py-1 rounded z-10">
            Featured
          </div>
        )}
      </Link>

      {/* Product Details - Clean, minimal design matching reference */}
      <div className="px-6 pt-6 pb-6 bg-white flex flex-col flex-1">
        {/* Product Heading - Main title */}
        <Link href={`/products/${id}`} className="mb-3 group">
          <h2 className="text-lg font-medium text-black leading-tight group-hover:text-brand-champagne transition-colors">
            {name}
          </h2>
        </Link>

        {/* Rating, Review Count, and Price */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <StarRating rating={rating} />
            <span className="text-sm text-gray-600">{reviewCount} reviews</span>
          </div>
          <span className="text-[18px] font-semibold text-black">
            {price ? formatPrice(price) : "Price on request"}
          </span>
        </div>

        {/* Product Name/Type */}
        <Link href={`/products/${id}`} className="mb-2 group">
          <h3 className="text-base font-medium text-black group-hover:text-brand-champagne transition-colors">
            {name.split(' ').slice(-2).join(' ')}
          </h3>
        </Link>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Bottom Section: Add to Cart button only */}
        <div className="mt-auto">
          {/* Full-width Add to Cart button - Black */}
          <Link href={`/products/${id}`} className="block">
            <button 
              className="w-full bg-black hover:bg-gray-800 text-white py-3.5 px-4 rounded-md transition-all duration-200 font-medium text-sm"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/products/${id}`;
              }}
            >
              Add to cart
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
