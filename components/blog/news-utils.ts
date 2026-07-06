import { stripHtml } from "@/lib/utils";

export type NewsPost = {
  id: string;
  title: string;
  excerpt: string | null;
  content?: string;
  author: string | null;
  publishedAt: string | null;
  image: string | null;
  heroImage?: string | null;
  slug: string;
};

export function getNewsLocale(language: string): string {
  return language === "pt" ? "pt-PT" : "en-GB";
}

export function formatNewsDate(dateString: string, language: string, style: "full" | "short" = "full"): string {
  const locale = getNewsLocale(language);
  const date = new Date(dateString);

  if (style === "short") {
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatNewsTime(dateString: string, language: string): string {
  const locale = getNewsLocale(language);
  return new Date(dateString).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getReadingTimeMinutes(content: string): number {
  const textContent = content.replace(/<[^>]*>/g, "");
  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function getTodayLabel(language: string): string {
  const locale = getNewsLocale(language);
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getNewsExcerpt(
  post: Pick<NewsPost, "excerpt" | "content">,
  maxLength = 120
): string | null {
  const excerpt = post.excerpt?.trim();
  if (excerpt) return excerpt;

  const plain = stripHtml(post.content).replace(/\s+/g, " ").trim();
  if (!plain) return null;
  if (plain.length <= maxLength) return plain;

  const trimmed = plain.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${trimmed}…`;
}
