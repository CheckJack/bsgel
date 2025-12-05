"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { CommentSection } from "@/components/blog/comment-section";

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

interface RelatedPost {
  id: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  slug: string;
  publishedAt: string | null;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [readingTime, setReadingTime] = useState<number>(0);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
      fetchRelatedPosts();
    }
  }, [slug]);

  useEffect(() => {
    if (post?.content) {
      // Calculate reading time (average reading speed: 200 words per minute)
      const textContent = post.content.replace(/<[^>]*>/g, '');
      const wordCount = textContent.trim().split(/\s+/).length;
      const time = Math.ceil(wordCount / 200);
      setReadingTime(time);
    }
  }, [post]);

  const fetchBlogPost = async () => {
    try {
      const res = await fetch(`/api/blogs/slug/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else if (res.status === 404) {
        setError("Blog post not found");
      } else {
        setError("Failed to load blog post");
      }
    } catch (error) {
      console.error("Failed to fetch blog post:", error);
      setError("Failed to load blog post");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const res = await fetch(`/api/blogs?published=true`);
      if (res.ok) {
        const data = await res.json();
        // Filter out current post and get up to 3 related posts
        const related = data
          .filter((p: BlogPost) => p.slug !== slug)
          .slice(0, 3)
          .map((p: BlogPost) => ({
            id: p.id,
            title: p.title,
            excerpt: p.excerpt,
            image: p.image,
            slug: p.slug,
            publishedAt: p.publishedAt,
          }));
        setRelatedPosts(related);
      }
    } catch (error) {
      console.error("Failed to fetch related posts:", error);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';
  const shareText = post?.excerpt || '';

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    const text = encodeURIComponent(shareText);

    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      default:
        return;
    }

    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {error || "Blog post not found"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Image - Full Width */}
      {post.image && (
        <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Back Button Overlay */}
          <div className="absolute top-4 left-4 z-10">
            <Link href="/blog">
              <Button 
                variant="ghost" 
                className="bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 lg:py-16">
        {/* Back Button - Only show if no hero image */}
        {!post.image && (
          <Link href="/blog">
            <Button variant="ghost" className="mb-6 lg:mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        )}

        <div className="max-w-4xl mx-auto w-full">
          <article className="w-full">
            <div className="overflow-hidden">
              {/* Header */}
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100 leading-tight">
                  {post.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{post.author}</span>
                    </div>
                  )}
                  {post.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  )}
                  {readingTime > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{readingTime} min read</span>
                    </div>
                  )}
                </div>

                {/* Share Buttons */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </header>

              {/* Excerpt */}
              {post.excerpt && post.excerpt.trim() && (
                <div className="mb-12 py-8 px-6 md:px-8 border-l-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xl md:text-2xl font-light text-gray-800 dark:text-gray-200 leading-relaxed italic">
                    {post.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none overflow-hidden w-full">
                <div
                  className="blog-content text-gray-700 dark:text-gray-300 leading-relaxed break-words"
                  style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content, {
                      ALLOWED_TAGS: [
                        "p",
                        "br",
                        "strong",
                        "em",
                        "u",
                        "s",
                        "h1",
                        "h2",
                        "h3",
                        "h4",
                        "h5",
                        "h6",
                        "ul",
                        "ol",
                        "li",
                        "blockquote",
                        "a",
                        "img",
                        "code",
                        "pre",
                        "hr",
                        "div",
                        "span",
                        "mark",
                      ],
                      ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel"],
                    }),
                  }}
                />
              </div>

              {/* Footer Actions */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Link href="/blog">
                    <Button variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Blog
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Share this post:</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('facebook')}
                        className="h-9 w-9 p-0"
                        aria-label="Share on Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('twitter')}
                        className="h-9 w-9 p-0"
                        aria-label="Share on Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare('linkedin')}
                        className="h-9 w-9 p-0"
                        aria-label="Share on LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <CommentSection blogSlug={slug} />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
                Related Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
                  >
                    <Link href={`/blog/${relatedPost.slug}`}>
                      {relatedPost.image && (
                        <div className="relative w-full h-48 overflow-hidden">
                          <Image
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {relatedPost.title}
                        </CardTitle>
                        {relatedPost.publishedAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(relatedPost.publishedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </CardHeader>
                      {relatedPost.excerpt && (
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {relatedPost.excerpt}
                          </p>
                        </CardContent>
                      )}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
