"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { formatNewsDate, type NewsPost } from "@/components/blog/news-utils";

type NewsTopStoriesProps = {
  posts: NewsPost[];
};

export function NewsTopStories({ posts }: NewsTopStoriesProps) {
  const { t, language } = useLanguage();

  if (posts.length === 0) return null;

  return (
    <section className="border-b border-black/10 bg-brand-white py-8 sm:py-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="mb-6 flex items-center gap-3 font-header text-sm font-bold uppercase tracking-[0.12em] text-brand-black">
          <span className="inline-block h-5 w-1 bg-pink-900" aria-hidden />
          {t("bioNews.topStories")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group border border-black/8 bg-brand-white transition-shadow hover:shadow-md"
            >
              {post.image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-sweet-bianca">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-4">
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt}
                    className="font-header text-[10px] uppercase tracking-[0.1em] text-brand-black/45"
                  >
                    {formatNewsDate(post.publishedAt, language, "short")}
                  </time>
                )}
                <h3 className="mt-2 line-clamp-3 font-header text-[15px] font-semibold leading-snug text-brand-black transition-colors group-hover:text-pink-900">
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
