"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Send, User, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { formatNewsDate } from "@/components/blog/news-utils";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface CommentSectionProps {
  blogSlug: string;
}

export function CommentSection({ blogSlug }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/blogs/slug/${blogSlug}/comments`);
        if (res.ok) {
          setComments(await res.json());
        }
      } catch (fetchError) {
        console.error("Failed to fetch comments:", fetchError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [blogSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push("/login");
      return;
    }

    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/blogs/slug/${blogSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });

      if (res.ok) {
        setComments([await res.json(), ...comments]);
        setCommentContent("");
      } else {
        const data = await res.json();
        setError(data.error || t("bioNews.loadError"));
      }
    } catch (submitError) {
      console.error("Failed to post comment:", submitError);
      setError(t("bioNews.loadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserDisplayName = (user: Comment["user"]) => {
    return user.name || user.email.split("@")[0] || "Anonymous";
  };

  return (
    <section className="border-t border-black/10 bg-[#f7f6f4]">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
      <h2 className="font-display text-2xl text-brand-black">
        {t("bioNews.comments")} ({comments.length})
      </h2>

      {status === "loading" ? (
        <p className="mt-6 font-header text-sm text-brand-black/50">{t("bioNews.loading")}</p>
      ) : session ? (
        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="news-comment" className="sr-only">
            {t("bioNews.leaveComment")}
          </label>
          <textarea
            id="news-comment"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t("bioNews.commentPlaceholder")}
            rows={4}
            className="w-full resize-none border border-black/10 bg-brand-white px-4 py-3 font-header text-sm text-brand-black outline-none transition-colors focus:border-brand-champagne"
            disabled={isSubmitting}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !commentContent.trim()}
              className="rounded-full bg-brand-black px-6 font-header text-sm hover:bg-brand-black/90"
            >
              {isSubmitting ? (
                t("bioNews.posting")
              ) : (
                <>
                  <Send className="mr-2 size-4" aria-hidden />
                  {t("bioNews.postComment")}
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-8 rounded-2xl bg-[#faf8f6] px-6 py-8 text-center">
          <LogIn className="mx-auto mb-3 size-7 text-brand-black/30" aria-hidden />
          <p className="font-header text-sm text-brand-black/65">{t("bioNews.loginToComment")}</p>
          <Link href="/login" className="mt-4 inline-block">
            <Button className="rounded-full bg-brand-black px-6 font-header text-sm hover:bg-brand-black/90">
              {t("bioNews.logIn")}
            </Button>
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-black/10 border-t-brand-champagne" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-8 font-header text-sm text-brand-black/50">{t("bioNews.noComments")}</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-4">
              <div className="shrink-0">
                {comment.user.image ? (
                  <img
                    src={comment.user.image}
                    alt={getUserDisplayName(comment.user)}
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-full bg-brand-sweet-bianca">
                    <User className="size-5 text-brand-black/40" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 border-b border-black/8 pb-8">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-header text-sm font-medium text-brand-black">
                    {getUserDisplayName(comment.user)}
                  </span>
                  <time
                    dateTime={comment.createdAt}
                    className="font-header text-xs text-brand-black/45"
                  >
                    {formatNewsDate(comment.createdAt, language, "short")}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words font-header text-sm leading-relaxed text-brand-black/80">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
        </div>
      </div>
    </section>
  );
}
