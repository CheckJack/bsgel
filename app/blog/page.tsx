"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { NewsSiteHeader } from "@/components/blog/news-site-header";
import { NewsSplitHero } from "@/components/blog/news-split-hero";
import { NewsTopStories } from "@/components/blog/news-top-stories";
import { NewsFeedList } from "@/components/blog/news-feed-list";
import { NewsSidebar } from "@/components/blog/news-sidebar";
import type { NewsPost } from "@/components/blog/news-utils";

function NewsLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#f7f6f4]">
      <div className="size-10 animate-spin rounded-full border-2 border-brand-black/10 border-t-pink-900" />
    </div>
  );
}

export default function BlogPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const res = await fetch("/api/blogs?published=true");
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch news stories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const mainStory = posts[0];
  const sideStories = posts.slice(1, 4);
  const topStories = posts.slice(0, Math.min(4, posts.length));
  const feedStories = posts.slice(4);
  const tickerTitles = posts.slice(0, 5).map((p) => p.title);

  return (
    <div className="min-h-screen bg-brand-white">
      <NewsSiteHeader tickerTitles={tickerTitles} />

      {isLoading ? (
        <NewsLoading />
      ) : posts.length === 0 ? (
        <div className="container mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="border border-black/10 bg-[#f7f6f4] px-6 py-16 text-center">
            <p className="font-display text-3xl text-brand-black">{t("bioNews.emptyTitle")}</p>
            <p className="mx-auto mt-4 max-w-md font-header text-base text-brand-black/60">
              {t("bioNews.emptyDescription")}
            </p>
          </div>
        </div>
      ) : (
        <>
          {mainStory && <NewsSplitHero main={mainStory} side={sideStories} />}

          <NewsTopStories posts={topStories} />

          <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
            {(feedStories.length > 0 || posts.length > 1) && (
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-8">
                  {feedStories.length > 0 && <NewsFeedList posts={feedStories} />}
                </div>
                <div className={feedStories.length > 0 ? "lg:col-span-4" : "lg:col-span-4 lg:col-start-9"}>
                  <NewsSidebar posts={posts} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
