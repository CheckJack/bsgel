"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { formatNewsDate, type NewsPost } from "@/components/blog/news-utils";
import { cn } from "@/lib/utils";

type NewsFeedListProps = {
  posts: NewsPost[];
  title?: string;
};

export function NewsFeedList({ posts, title }: NewsFeedListProps) {
  const { t, language } = useLanguage();

  if (posts.length === 0) return null;

  const [leadPost, ...restPosts] = posts;

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-black/10 pb-4">
        <h2 className="flex items-center gap-3 font-header text-sm font-bold uppercase tracking-[0.12em] text-brand-black">
          <span className="inline-block h-5 w-1 bg-pink-900" aria-hidden />
          {title ?? t("bioNews.latestHeadlines")}
        </h2>
        <span className="font-header text-xs text-brand-black/45">
          {posts.length === 1
            ? t("bioNews.articlesCountOne")
            : t("bioNews.articlesCount", { n: String(posts.length) })}
        </span>
      </div>

      {/* Lead item in feed — wide horizontal card */}
      {leadPost && (
        <article className="mb-6">
          <Link
            href={`/blog/${leadPost.slug}`}
            className="group grid overflow-hidden border border-black/10 bg-brand-white transition-all hover:border-pink-900/25 hover:shadow-md sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
          >
            {leadPost.image && (
              <div className="relative aspect-[16/10] overflow-hidden bg-brand-sweet-bianca sm:aspect-auto sm:min-h-[220px]">
                <Image
                  src={leadPost.image}
                  alt={leadPost.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 420px"
                  loading="lazy"
                  unoptimized
                />
              </div>
            )}
            <div className="flex flex-col justify-center p-5 sm:p-6">
              {leadPost.publishedAt && (
                <time
                  dateTime={leadPost.publishedAt}
                  className="font-header text-xs text-brand-champagne-dark"
                >
                  {formatNewsDate(leadPost.publishedAt, language, "short")}
                </time>
              )}
              <h3 className="mt-2 font-display text-2xl font-normal leading-snug tracking-tight text-brand-black transition-colors group-hover:text-pink-900">
                {leadPost.title}
              </h3>
              {leadPost.excerpt && (
                <p className="mt-3 line-clamp-3 font-header text-sm leading-relaxed text-brand-black/65 sm:text-[15px]">
                  {leadPost.excerpt}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between gap-3">
                {leadPost.author ? (
                  <span className="font-header text-xs text-brand-black/45">
                    {t("bioNews.by")} {leadPost.author}
                  </span>
                ) : (
                  <span aria-hidden />
                )}
                <span className="inline-flex items-center gap-1 font-header text-[11px] uppercase tracking-[0.12em] text-brand-black/55 transition-colors group-hover:text-pink-900">
                  {t("bioNews.readMore")}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        </article>
      )}

      {/* Remaining articles — two-column card grid */}
      {restPosts.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {restPosts.map((post, index) => (
            <article
              key={post.id}
              className={cn(index === restPosts.length - 1 && restPosts.length % 2 === 1 && "sm:col-span-2 sm:max-w-md")}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden border border-black/10 bg-brand-white transition-all hover:border-pink-900/25 hover:shadow-md"
              >
                {post.image && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-brand-sweet-bianca">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 320px"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  {post.publishedAt && (
                    <time
                      dateTime={post.publishedAt}
                      className="font-header text-[10px] uppercase tracking-[0.1em] text-brand-black/45"
                    >
                      {formatNewsDate(post.publishedAt, language, "short")}
                    </time>
                  )}
                  <h3 className="mt-2 line-clamp-3 font-header text-[15px] font-semibold leading-snug text-brand-black transition-colors group-hover:text-pink-900 sm:text-base">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 flex-1 font-header text-sm leading-relaxed text-brand-black/60">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 font-header text-[10px] uppercase tracking-[0.12em] text-brand-black/45 transition-colors group-hover:text-pink-900">
                    {t("bioNews.readMore")}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
