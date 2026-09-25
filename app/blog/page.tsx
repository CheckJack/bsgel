import { getPublishedBlogPosts } from "@/lib/blog-public";
import { BlogHome } from "./blog-home";

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  return <BlogHome posts={posts} />;
}
