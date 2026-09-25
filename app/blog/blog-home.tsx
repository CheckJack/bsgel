"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { NewsSiteHeader } from "@/components/blog/news-site-header";
import { NewsFeedList } from "@/components/blog/news-feed-list";
import { NewsSidebar } from "@/components/blog/news-sidebar";
import { BlogNewsImage } from "@/components/blog/blog-news-image";
import {
  formatNewsDate,
  formatNewsTime,
  getNewsExcerpt,
  getReadingTimeMinutes,
  type NewsPost,
} from "@/components/blog/news-utils";

/** Matches individual article page horizontal rhythm */
const PAGE_PAD = "mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-6 lg:px-12 xl:px-16";

type BlogHomeProps = {
  posts: NewsPost[];
};

export function BlogHome({ posts }: BlogHomeProps) {
  const { t, language } = useLanguage();

  const lead = posts[0];
  const rest = posts.slice(1);
  const tickerTitles = posts.slice(0, 5).map((p) => p.title);

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-brand-white">
        <NewsSiteHeader tickerTitles={[]} />
        <div className={`${PAGE_PAD} py-20`}>
          <div className="border border-black/10 bg-[#f7f6f4] px-6 py-16 text-center">
            <p className="font-display text-3xl text-brand-black">{t("bioNews.emptyTitle")}</p>
            <p className="mx-auto mt-4 max-w-md font-header text-base text-brand-black/60">
              {t("bioNews.emptyDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const leadExcerpt = lead ? getNewsExcerpt(lead) : "";
  const leadReading = lead?.content ? getReadingTimeMinutes(lead.content) : 0;

  return (
    <div className="min-h-screen bg-brand-white">
      <NewsSiteHeader tickerTitles={tickerTitles} />

      {/* Intro strip — same grey band language as article breadcrumb */}
      <div className="border-b border-black/10 bg-[#f7f6f4]">
        <div className={`${PAGE_PAD} py-5 sm:py-6`}>
          <span className="inline-block bg-pink-900 px-2 py-1 font-header text-[10px] uppercase tracking-[0.16em] text-white">
            {t("bioNews.newsCategory")}
          </span>
          <h1 className="mt-3 font-display text-3xl font-normal leading-[1.08] tracking-tight text-brand-black sm:text-4xl">
            {t("bioNews.title")}
          </h1>
          <p className="mt-2 max-w-2xl font-header text-sm text-brand-black/60 sm:text-base">
            {t("bioNews.tagline")}
          </p>
        </div>
      </div>

      <div className={`${PAGE_PAD} py-8 sm:py-10`}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            {lead && (
              <article className="border-b border-black/10 pb-10">
                <header className="pb-6">
                  <span className="inline-block bg-pink-900 px-2 py-1 font-header text-[10px] uppercase tracking-[0.16em] text-white">
                    {t("bioNews.leadStory")}
                  </span>

                  <h2 className="mt-4">
                    <Link
                      href={`/blog/${lead.slug}`}
                      className="font-display text-3xl font-normal leading-[1.08] tracking-tight text-brand-black transition-colors hover:text-pink-900 sm:text-4xl md:text-[2.75rem]"
                    >
                      {lead.title}
                    </Link>
                  </h2>

                  {leadExcerpt && (
                    <p className="mt-4 border-l-4 border-pink-900/30 pl-4 font-header text-lg font-medium leading-relaxed text-brand-black/75 md:text-xl">
                      {leadExcerpt}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-black/8 pt-5 font-header text-sm text-brand-black/55">
                    {lead.author && (
                      <span className="font-semibold text-brand-black">
                        {t("bioNews.by")} {lead.author}
                      </span>
                    )}
                    {lead.publishedAt && (
                      <>
                        {lead.author && <span aria-hidden>·</span>}
                        <time dateTime={lead.publishedAt}>
                          {formatNewsDate(lead.publishedAt, language, "full")} ·{" "}
                          {formatNewsTime(lead.publishedAt, language)}
                        </time>
                      </>
                    )}
                    {leadReading > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{t("bioNews.minRead", { n: String(leadReading) })}</span>
                      </>
                    )}
                  </div>
                </header>

                {lead.image && (
                  <Link href={`/blog/${lead.slug}`} className="group block">
                    <figure className="mb-6">
                      <div className="relative aspect-[16/9] overflow-hidden bg-brand-sweet-bianca">
                        <BlogNewsImage
                          src={lead.image}
                          alt={lead.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                          priority
                          sizes="(max-width: 1024px) 100vw, 720px"
                        />
                      </div>
                    </figure>
                  </Link>
                )}

                <Link
                  href={`/blog/${lead.slug}`}
                  className="inline-flex items-center font-header text-[11px] uppercase tracking-[0.14em] text-brand-black transition-colors hover:text-pink-900"
                >
                  {t("bioNews.readFullStory")} →
                </Link>
              </article>
            )}

            {rest.length > 0 && (
              <div className="pt-10">
                <NewsFeedList posts={rest} />
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <NewsSidebar posts={posts} excludeSlug={lead?.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
