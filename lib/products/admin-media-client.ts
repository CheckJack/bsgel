/** Client helpers for admin product media (upload + preview). */

export async function uploadProductMediaFile(
  productId: string,
  file: File,
  hint = "upload"
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("hint", hint);

  const res = await fetch(`/api/products/${encodeURIComponent(productId)}/media`, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });

  if (!res.ok) {
    let msg = "Failed to upload media";
    if (res.status === 413) {
      msg = "File is too large for the server. Try a smaller image or video.";
    } else if (res.status === 503) {
      msg =
        "Upload blocked (site maintenance gate). Refresh the page, stay logged in as admin, and try again.";
    } else {
      try {
        const data = await res.json();
        msg = data.error || msg;
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("Upload did not return a URL");
  return data.url;
}

/** Admin previews should never go through the Next image optimizer. */
export function adminMediaUnoptimized(_src?: string): boolean {
  return true;
}

function isDeadWpUrl(url: string): boolean {
  return /\/wp-content\//i.test(url);
}

function isLocalUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}

/**
 * Prefer working local uploads over dead WordPress URLs for admin thumbnails.
 */
export function resolveAdminThumbnail(
  image?: string | null,
  images?: string[] | null
): string | null {
  const all = [image, ...(images ?? [])].filter(
    (u): u is string => typeof u === "string" && u.length > 0
  );
  const local = all.find(isLocalUploadUrl);
  if (local) return local;
  const remoteOk = all.find((u) => u.startsWith("http") && !isDeadWpUrl(u));
  if (remoteOk) return remoteOk;
  return all[0] ?? null;
}

/**
 * Normalize admin gallery URLs for save/load.
 * Keeps the user's order; drops blob: previews only. Does NOT strip WordPress
 * URLs when a local upload is added — that made append look like it "vanished".
 */
export function healAdminMediaUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (!u || u.startsWith("blob:") || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}
