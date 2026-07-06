"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { formatNewsDate, getNewsExcerpt, type NewsPost } from "@/components/blog/news-utils";

type NewsSplitHeroProps = {
  main: NewsPost;
  side: NewsPost[];
};

export function NewsSplitHero({ main, side }: NewsSplitHeroProps) {
  const { t, language } = useLanguage();

  return (
    <section className="grid gap-0 border-b border-black/10 lg:grid-cols-12 lg:items-stretch">
      {/* Lead story — full-bleed left column */}
      <Link
        href={`/blog/${main.slug}`}
        className="group relative min-h-[320px] overflow-hidden bg-brand-black lg:col-span-8 lg:min-h-[480px]"
      >
        {main.image ? (
          <Image
            src={main.image}
            alt={main.title}
            fill
            className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-brand-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 pb-5 sm:pb-8">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <span className="inline-block bg-pink-900 px-2 py-1 font-header text-[10px] uppercase tracking-[0.16em] text-white">
              {t("bioNews.leadStory")}
            </span>
            {main.publishedAt && (
              <time
                dateTime={main.publishedAt}
                className="mt-3 block font-header text-xs text-white/70"
              >
                {formatNewsDate(main.publishedAt, language, "short")}
              </time>
            )}
            <h2 className="mt-2 max-w-2xl font-display text-2xl font-normal leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.5rem]">
              {main.title}
            </h2>
            {main.excerpt && (
              <p className="mt-3 line-clamp-2 max-w-2xl font-header text-sm leading-relaxed text-white/85 sm:text-base">
                {main.excerpt}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Side stack — stretches to match hero height */}
      <div className="flex min-h-[320px] flex-col divide-y divide-black/10 border-t border-black/10 bg-[#f7f6f4] lg:col-span-4 lg:min-h-[480px] lg:border-l lg:border-t-0">
        {side.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 font-header text-sm text-brand-black/45">
            {t("bioNews.moreStories")}
          </div>
        ) : (
          side.map((post) => {
            const excerpt = getNewsExcerpt(post);

            return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-1 gap-4 bg-brand-white p-4 transition-colors hover:bg-[#faf9f7] sm:p-5"
            >
              {post.image && (
                <div className="relative size-20 shrink-0 overflow-hidden bg-brand-sweet-bianca sm:size-24">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="96px"
                    loading="lazy"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt}
                    className="font-header text-[10px] uppercase tracking-[0.1em] text-brand-black/45"
                  >
                    {formatNewsDate(post.publishedAt, language, "short")}
                  </time>
                )}
                <h3 className="mt-1 line-clamp-2 font-header text-sm font-semibold leading-snug text-brand-black transition-colors group-hover:text-pink-900 sm:text-[15px]">
                  {post.title}
                </h3>
                {excerpt && (
                  <p className="mt-1.5 line-clamp-2 font-header text-xs leading-relaxed text-brand-black/55 sm:text-sm">
                    {excerpt}
                  </p>
                )}
              </div>
            </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
