"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, Facebook, Linkedin, Twitter } from "lucide-react";
import { BlogRichContent } from "@/components/blog/blog-rich-content";
import { useLanguage } from "@/contexts/language-context";
import { CommentSection } from "@/components/blog/comment-section";
import { NewsSiteHeader } from "@/components/blog/news-site-header";
import { NewsSidebar } from "@/components/blog/news-sidebar";
import { BlogNewsImage } from "@/components/blog/blog-news-image";
import {
  formatNewsDate,
  formatNewsTime,
  getReadingTimeMinutes,
  type NewsPost,
} from "@/components/blog/news-utils";

type BlogArticleProps = {
  post: NewsPost;
  sidebarPosts: NewsPost[];
};

export function BlogArticle({ post, sidebarPosts }: BlogArticleProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const readingTime = post.content ? getReadingTimeMinutes(post.content) : 0;
  const heroBannerImage = post.heroImage || post.image;
  const tickerTitles = sidebarPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 4)
    .map((p) => p.title);

  const handleShare = (platform: "facebook" | "twitter" | "linkedin") => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(post.title || "");
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    window.open(links[platform], "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error("Failed to copy link:", copyError);
    }
  };

  return (
    <div className="min-h-screen bg-brand-white">
      <NewsSiteHeader tickerTitles={tickerTitles} />

      <div className="border-b border-black/10 bg-[#f7f6f4]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-1 px-4 py-2.5 font-header text-xs text-brand-black/55 sm:px-6 md:px-6 lg:px-12 xl:px-16">
          <Link href="/blog" className="transition-colors hover:text-pink-900">
            {t("bioNews.title")}
          </Link>
          <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          <span className="line-clamp-1 text-brand-black">{post.title}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:px-6 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <article className="lg:col-span-8">
            <header className="border-b border-black/10 pb-6">
              <span className="inline-block bg-pink-900 px-2 py-1 font-header text-[10px] uppercase tracking-[0.16em] text-white">
                {t("bioNews.newsCategory")}
              </span>

              <h1 className="mt-4 font-display text-3xl font-normal leading-[1.08] tracking-tight text-brand-black sm:text-4xl md:text-[2.75rem]">
                {post.title}
              </h1>

              {post.excerpt?.trim() && (
                <p className="mt-4 border-l-4 border-pink-900/30 pl-4 font-header text-lg font-medium leading-relaxed text-brand-black/75 md:text-xl">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/8 pt-5">
                <div className="font-header text-sm text-brand-black/55">
                  {post.author && (
                    <span className="font-semibold text-brand-black">
                      {t("bioNews.by")} {post.author}
                    </span>
                  )}
                  {post.publishedAt && (
                    <>
                      {post.author && <span className="mx-2" aria-hidden>·</span>}
                      <time dateTime={post.publishedAt}>
                        {formatNewsDate(post.publishedAt, language, "full")} ·{" "}
                        {formatNewsTime(post.publishedAt, language)}
                      </time>
                    </>
                  )}
                  {readingTime > 0 && (
                    <>
                      <span className="mx-2" aria-hidden>·</span>
                      <span>{t("bioNews.minRead", { n: String(readingTime) })}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ["facebook", Facebook],
                      ["twitter", Twitter],
                      ["linkedin", Linkedin],
                    ] as const
                  ).map(([platform, Icon]) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handleShare(platform)}
                      className="inline-flex size-8 items-center justify-center border border-black/12 text-brand-black/60 transition-colors hover:border-pink-900 hover:text-pink-900"
                      aria-label={platform}
                    >
                      <Icon className="size-3.5" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex h-8 items-center gap-1.5 border border-black/12 px-2.5 font-header text-[10px] uppercase tracking-wide text-brand-black/60 transition-colors hover:border-pink-900 hover:text-pink-900"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? t("bioNews.copied") : t("bioNews.copyLink")}
                  </button>
                </div>
              </div>
            </header>

            {heroBannerImage && (
              <figure className="my-8">
                <div className="relative aspect-[16/9] overflow-hidden bg-brand-sweet-bianca">
                  <BlogNewsImage
                    src={heroBannerImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 720px"
                  />
                </div>
              </figure>
            )}

            <div className="blog-content font-header text-[17px] leading-[1.85] text-brand-black/90">
              <BlogRichContent content={post.content || ""} />
            </div>
          </article>

          <div className="lg:col-span-4">
            <NewsSidebar posts={sidebarPosts} excludeSlug={post.slug} />
          </div>
        </div>
      </div>

      <CommentSection blogSlug={post.slug} />
    </div>
  );
}
