"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import { HeroSlider } from "@/components/layout/hero-slider";
import Image from "next/image";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  publishedAt: string | null;
  image: string | null;
  slug: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const slides = [
    {
      type: "image" as const,
      src: "/Training_1.webp",
      title: "Insights & Inspiration",
      description: "Discover expert techniques, industry insights, and the latest innovations in healthy, ethical, and professional nail care",
    },
  ];

  const fetchBlogPosts = async () => {
    try {
      const res = await fetch("/api/blogs?published=true");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[400px]" />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[300px] sm:h-[400px]" />
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-base sm:text-lg">
              No blog posts available at the moment.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
              Check back soon for updates!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
              {post.image && (
                <div className="relative w-full h-64 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 text-xl">{post.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
                  {post.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                  )}
                  {post.publishedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {post.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-1">
                    {post.excerpt}
                  </p>
                )}
                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline" className="w-full group">
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
}

