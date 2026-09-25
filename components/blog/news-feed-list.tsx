"use client";

import Link from "next/link";
import { BlogNewsImage } from "@/components/blog/blog-news-image";
import { useLanguage } from "@/contexts/language-context";
import {
  formatNewsDate,
  getNewsExcerpt,
  getReadingTimeMinutes,
  type NewsPost,
} from "@/components/blog/news-utils";

type NewsFeedListProps = {
  posts: NewsPost[];
  title?: string;
};

export function NewsFeedList({ posts, title }: NewsFeedListProps) {
  const { t, language } = useLanguage();

  if (posts.length === 0) return null;

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

      <div className="divide-y divide-black/10">
        {posts.map((post) => {
          const excerpt = getNewsExcerpt(post);
          const reading = post.content ? getReadingTimeMinutes(post.content) : 0;

          return (
            <article key={post.id} className="py-6 first:pt-0">
              <Link
                href={`/blog/${post.slug}`}
                className="group grid gap-5 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start md:grid-cols-[minmax(0,1fr)_200px]"
              >
                <div className="min-w-0">
                  <span className="inline-block bg-pink-900/90 px-1.5 py-0.5 font-header text-[9px] uppercase tracking-[0.14em] text-white">
                    {t("bioNews.newsCategory")}
                  </span>

                  <h3 className="mt-2 font-display text-xl font-normal leading-snug tracking-tight text-brand-black transition-colors group-hover:text-pink-900 sm:text-2xl">
                    {post.title}
                  </h3>

                  {excerpt && (
                    <p className="mt-2 line-clamp-2 font-header text-sm leading-relaxed text-brand-black/65 sm:text-[15px]">
                      {excerpt}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-header text-xs text-brand-black/50">
                    {post.author && (
                      <span className="font-semibold text-brand-black/70">
                        {t("bioNews.by")} {post.author}
                      </span>
                    )}
                    {post.publishedAt && (
                      <>
                        {post.author && <span aria-hidden>·</span>}
                        <time dateTime={post.publishedAt}>
                          {formatNewsDate(post.publishedAt, language, "short")}
                        </time>
                      </>
                    )}
                    {reading > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{t("bioNews.minRead", { n: String(reading) })}</span>
                      </>
                    )}
                  </div>
                </div>

                {post.image && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-brand-sweet-bianca sm:aspect-[4/3]">
                    <BlogNewsImage
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 200px"
                      loading="lazy"
                    />
                  </div>
                )}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
