import { slugFromTitle } from "@/lib/blog";

/** Blog editor and public site expect HTML (TipTap), not plain text or markdown. */
export function looksLikeBlogHtml(content: string): boolean {
  return /<(p|h[1-6]|ul|ol|li|blockquote|div|strong|em)\b/i.test(content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

/**
 * Converts markdown-style blog drafts to HTML for the rich text editor.
 * If content is already HTML, returns it trimmed.
 */
export function markdownToBlogHtml(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (looksLikeBlogHtml(trimmed)) return trimmed;

  const blocks = trimmed.split(/\n{2,}/);
  const htmlParts: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const first = lines[0];

    if (/^#{1}\s+/.test(first)) {
      htmlParts.push(`<h1>${inlineMarkdown(first.replace(/^#\s+/, ""))}</h1>`);
      for (const line of lines.slice(1)) {
        htmlParts.push(`<p>${inlineMarkdown(line)}</p>`);
      }
      continue;
    }

    if (/^#{2}\s+/.test(first)) {
      htmlParts.push(`<h2>${inlineMarkdown(first.replace(/^##\s+/, ""))}</h2>`);
      for (const line of lines.slice(1)) {
        htmlParts.push(`<p>${inlineMarkdown(line)}</p>`);
      }
      continue;
    }

    if (/^#{3}\s+/.test(first)) {
      htmlParts.push(`<h3>${inlineMarkdown(first.replace(/^###\s+/, ""))}</h3>`);
      for (const line of lines.slice(1)) {
        htmlParts.push(`<p>${inlineMarkdown(line)}</p>`);
      }
      continue;
    }

    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      htmlParts.push(
        "<ul>" + lines.map((l) => `<li>${inlineMarkdown(l.replace(/^[-*]\s+/, ""))}</li>`).join("") + "</ul>"
      );
      continue;
    }

    if (lines.every((l) => /^\d+\.\s+/.test(l))) {
      htmlParts.push(
        "<ol>" +
          lines.map((l) => `<li>${inlineMarkdown(l.replace(/^\d+\.\s+/, ""))}</li>`).join("") +
          "</ol>"
      );
      continue;
    }

    if (lines.length === 1 && first.startsWith(">")) {
      htmlParts.push(`<blockquote><p>${inlineMarkdown(first.replace(/^>\s?/, ""))}</p></blockquote>`);
      continue;
    }

    htmlParts.push(`<p>${inlineMarkdown(lines.join(" "))}</p>`);
  }

  return htmlParts.join("\n");
}

export function buildSeoExcerpt(excerpt: string | undefined, content: string, title: string): string {
  const explicit = excerpt?.trim();
  if (explicit && explicit.length >= 50) return explicit.slice(0, 160);

  const plain = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const base = explicit || plain || title;
  if (base.length <= 160) return base;
  const cut = base.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function buildSeoSlug(slug: string | undefined, title: string): string {
  const s = slug?.trim() ? slugFromTitle(slug) : slugFromTitle(title);
  return s.slice(0, 80);
}

export function summarizeBlogStructure(content: string): string {
  const headings = Array.from(content.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)).map((m) => {
    const level = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    return `H${level}: ${text}`;
  });

  const paragraphs = (content.match(/<p\b/gi) || []).length;
  const lists = (content.match(/<(ul|ol)\b/gi) || []).length;

  const parts = [
    headings.length ? `${headings.length} section heading(s)` : "⚠ no H2/H3 headings",
    `${paragraphs} paragraph(s)`,
    lists ? `${lists} list(s)` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}
