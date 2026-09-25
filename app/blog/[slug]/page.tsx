import { notFound } from "next/navigation";
import { getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog-public";
import { BlogArticle } from "./blog-article";
import type { NewsPost } from "@/components/blog/news-utils";

export const revalidate = 300;

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [post, sidebarPosts] = await Promise.all([
    getPublishedBlogPostBySlug(slug),
    getPublishedBlogPosts(),
  ]);

  if (!post) {
    notFound();
  }

  return <BlogArticle post={post as NewsPost} sidebarPosts={sidebarPosts} />;
}
