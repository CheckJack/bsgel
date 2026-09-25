"use client";

import Image from "next/image";
import { shouldUseUnoptimizedBlogImage } from "@/components/blog/news-utils";

type BlogNewsImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
};

export function BlogNewsImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
  loading,
}: BlogNewsImageProps) {
  const unoptimized = shouldUseUnoptimizedBlogImage(src);

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={loading}
      unoptimized={unoptimized}
    />
  );
}
