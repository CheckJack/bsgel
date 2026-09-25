"use client";

import Image from "next/image";
import Link from "next/link";
import { BlogNewsImage } from "@/components/blog/blog-news-image";
import { useLanguage } from "@/contexts/language-context";
import { productPath } from "@/lib/products/paths";
import type { NewsPost } from "@/components/blog/news-utils";

const SIDEBAR_AD = {
  image: "/images/ads/almond-cuticle-oil.png",
  href: productPath("TRE34"),
  altKey: "naturalNailTreatments.products.almondOil.name" as const,
};

type NewsSidebarProps = {
  posts: NewsPost[];
  excludeSlug?: string;
};

export function NewsSidebar({ posts, excludeSlug }: NewsSidebarProps) {
  const { t } = useLanguage();

  const items = posts.filter((p) => p.slug !== excludeSlug);
  const featuredSide = items.slice(0, 2);

  return (
    <aside className="space-y-8 lg:sticky lg:top-[var(--site-header-height,113px)] lg:self-start">
      <div
        className="overflow-hidden border border-black/10 bg-[#f7f6f4]"
        data-ad-slot="bio-news-sidebar"
      >
        <Link
          href={SIDEBAR_AD.href}
          className="group relative block aspect-[7/8] w-full overflow-hidden bg-[#ebe9e6]"
          aria-label={`${t("bioNews.advertisement")}: ${t(SIDEBAR_AD.altKey)}`}
        >
          <Image
            src={SIDEBAR_AD.image}
            alt={t(SIDEBAR_AD.altKey)}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 360px"
            priority={false}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3 pb-2.5 pt-8">
            <span className="font-header text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
              {t("bioNews.advertisement")}
            </span>
          </span>
        </Link>
      </div>

      {featuredSide.length > 0 && (
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
                className="group block border-b border-black/10 pb-5 last:border-b-0 last:pb-0"
              >
                {post.image && (
                  <div className="relative mb-3 aspect-[16/10] overflow-hidden bg-brand-sweet-bianca">
                    <BlogNewsImage
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="320px"
                      loading="lazy"
                    />
                  </div>
                )}
                <h3 className="line-clamp-3 font-header text-sm font-semibold leading-snug text-brand-black group-hover:text-pink-900">
                  {post.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
