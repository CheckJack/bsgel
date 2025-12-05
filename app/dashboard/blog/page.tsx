"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  image?: string;
  slug: string;
}

export default function BlogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchBlogPosts();
    }
  }, [session, status, router]);

  const fetchBlogPosts = async () => {
    try {
      // TODO: Replace with actual API endpoint when available
      // const res = await fetch("/api/blog");
      // if (res.ok) {
      //   const data = await res.json();
      //   setPosts(data);
      // }
      
      // Mock data for now
      setPosts([
        {
          id: "1",
          title: "The Art of Bio Sculpture Nail Care",
          excerpt: "Discover the techniques and products that make Bio Sculpture the leading choice for professional nail care.",
          content: "",
          author: "Bio Sculpture Team",
          publishedAt: new Date().toISOString(),
          image: "/hero-banner.jpg",
          slug: "art-of-bio-sculpture",
        },
        {
          id: "2",
          title: "New Product Launch: Spring Collection 2024",
          excerpt: "Explore our latest collection featuring vibrant colors and innovative formulas designed for the modern salon.",
          content: "",
          author: "Product Team",
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          image: "/Cuticle Oils (1).jpg",
          slug: "spring-collection-2024",
        },
        {
          id: "3",
          title: "Salon Training Program: Become a Certified Professional",
          excerpt: "Learn about our comprehensive training program that helps salon professionals master Bio Sculpture techniques.",
          content: "",
          author: "Training Team",
          publishedAt: new Date(Date.now() - 172800000).toISOString(),
          slug: "salon-training-program",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="text-center py-8">Loading blog posts...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stay updated with the latest news, tips, and insights from Bio Sculpture
        </p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              No blog posts available at the moment.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Check back soon for updates!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow flex flex-col">
              {post.image && (
                <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
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
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-gray-600 dark:text-gray-400 mb-4 flex-1">
                  {post.excerpt}
                </p>
                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline" className="w-full">
                    Read More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

