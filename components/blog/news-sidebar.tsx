"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { formatNewsDate, type NewsPost } from "@/components/blog/news-utils";

type NewsSidebarProps = {
  posts: NewsPost[];
  excludeSlug?: string;
};

export function NewsSidebar({ posts, excludeSlug }: NewsSidebarProps) {
  const { t, language } = useLanguage();

  const items = posts.filter((p) => p.slug !== excludeSlug);
  if (items.length === 0) return null;

  const headlineList = items.slice(0, 6);
  const featuredSide = items.slice(0, 2);

  return (
    <aside className="space-y-8 lg:sticky lg:top-[var(--site-header-height,113px)] lg:self-start">
      {/* Text headlines widget */}
      <div className="border border-black/10 bg-[#f7f6f4]">
        <div className="border-b border-black/10 bg-brand-black px-4 py-3">
          <h2 className="font-header text-[11px] font-bold uppercase tracking-[0.16em] text-white">
            {t("bioNews.inTheHeadlines")}
          </h2>
        </div>
        <ol className="divide-y divide-black/8">
          {headlineList.map((post, index) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex gap-3 px-4 py-4 transition-colors hover:bg-brand-white"
              >
                <span className="font-display text-2xl leading-none text-pink-900/80">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="line-clamp-3 font-header text-sm font-semibold leading-snug text-brand-black group-hover:text-pink-900">
                    {post.title}
                  </h3>
                  {post.publishedAt && (
                    <time
                      dateTime={post.publishedAt}
                      className="mt-1 block font-header text-[10px] text-brand-black/45"
                    >
                      {formatNewsDate(post.publishedAt, language, "short")}
                    </time>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Featured sidebar cards */}
      <div>
        <h2 className="mb-4 flex items-center gap-3 font-header text-sm font-bold uppercase tracking-[0.12em] text-brand-black">
          <span className="inline-block h-5 w-1 bg-pink-900" aria-hidden />
          {t("bioNews.moreStories")}
        </h2>
        <div className="space-y-5">
          {featuredSide.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block border border-black/10 bg-brand-white"
            >
              {post.image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-sweet-bianca">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="320px"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="line-clamp-3 font-header text-sm font-semibold leading-snug text-brand-black group-hover:text-pink-900">
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
