const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 12_000;

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((p) => p.test(hostname));
}

function stripHtmlToText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ");

  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, " ").trim()) : "";

  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  text = decodeEntities(text);

  if (title && !text.startsWith(title)) {
    return `Title: ${title}\n\n${text}`.slice(0, 48_000);
  }

  return text.slice(0, 48_000);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function fetchWebPageText(url: string): Promise<{
  url: string;
  title?: string;
  text: string;
  truncated: boolean;
}> {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error("Invalid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (isBlockedHost(parsed.hostname)) {
    throw new Error("This URL cannot be fetched for security reasons.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "BioSculpture-Holo/1.0 (admin research)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching the page.`);
    }

    const contentType = res.headers.get("content-type") || "";
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Empty response.");

    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        chunks.push(value.slice(0, MAX_BYTES - (total - value.byteLength)));
        break;
      }
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);
    const raw = buffer.toString("utf-8");

    const isHtml = contentType.includes("html") || /<html[\s>]/i.test(raw);
    const text = isHtml ? stripHtmlToText(raw) : raw.trim().slice(0, 48_000);

    if (!text || text.length < 40) {
      throw new Error("Could not extract meaningful text from this page.");
    }

    const titleLine = text.startsWith("Title: ") ? text.split("\n")[0].replace(/^Title:\s*/, "") : undefined;

    return {
      url: parsed.toString(),
      title: titleLine,
      text,
      truncated: total > MAX_BYTES,
    };
  } finally {
    clearTimeout(timer);
  }
}
