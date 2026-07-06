"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SitePageMediaItem } from "@/lib/seo/types";

const TITLE_MAX = 65;
const DESC_MAX = 160;

function SeoEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = searchParams.get("path") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [isDynamic, setIsDynamic] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [permalink, setPermalink] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [media, setMedia] = useState<SitePageMediaItem[]>([]);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/site-seo?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setName(data.name);
      setIsDynamic(data.isDynamic);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setPermalink(data.permalink || data.path);
      setOgImage(data.ogImage || "");
      setMedia(data.media || []);
    } catch {
      toast("Failed to load page SEO", "error");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewUrl = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}${permalink || path}`;
  }, [permalink, path]);

  const handleSave = async () => {
    if (title.length > TITLE_MAX) {
      toast(`Title must be ${TITLE_MAX} characters or fewer`, "error");
      return;
    }
    if (description.length > DESC_MAX) {
      toast(`Meta description must be ${DESC_MAX} characters or fewer`, "error");
      return;
    }
    if (permalink && !permalink.startsWith("/")) {
      toast("Permalink must start with /", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-seo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, title, description, permalink, ogImage, media }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      toast("SEO settings saved", "success");
      router.push("/admin/pages");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateMediaAlt = (id: string, alt: string) => {
    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, alt } : m)));
  };

  const addMediaRow = () => {
    const id = `media-${Date.now()}`;
    setMedia((prev) => [
      ...prev,
      { id, label: "Image", src: "", alt: "" },
    ]);
  };

  if (!path) {
    return (
      <div className="p-8">
        <p className="text-gray-500">No page selected.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/admin/pages">Back to list</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return <p className="p-8 text-gray-500">Loading…</p>;
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/admin/pages">
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
          <p className="font-mono text-sm text-gray-500">{path}</p>
          {isDynamic && (
            <p className="mt-1 text-xs text-amber-600">
              Dynamic route — placeholders like {"{productName}"} apply to all matching URLs.
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Saving…" : "Save SEO"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search engine optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 flex justify-between text-sm font-medium">
                  <span>Title tag</span>
                  <span className={cn(title.length > TITLE_MAX && "text-red-600")}>
                    {title.length}/{TITLE_MAX}
                  </span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Unique, keyword-focused title under 65 characters"
                />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-sm font-medium">
                  <span>Meta description</span>
                  <span className={cn(description.length > DESC_MAX && "text-red-600")}>
                    {description.length}/{DESC_MAX}
                  </span>
                </label>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Benefit-driven summary with primary keyword, ~140–160 characters"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">URL / Permalink</label>
                <Input
                  value={permalink}
                  onChange={(e) => setPermalink(e.target.value)}
                  placeholder="/short-readable-url"
                  className="font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Short, readable path with main keyword. Used as canonical URL.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Page media & alt text</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addMediaRow}>
                Add image
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {media.length === 0 ? (
                <p className="text-sm text-gray-500">No media registered for this page. Add images used on this page and set alt text for accessibility and image SEO.</p>
              ) : (
                media.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-lg border p-4 dark:border-gray-700">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded bg-gray-100">
                      {item.src && (item.src.startsWith("/") || item.src.startsWith("http")) ? (
                        <Image src={item.src} alt="" fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs text-gray-400">No preview</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          setMedia((prev) =>
                            prev.map((m) => (m.id === item.id ? { ...m, label: e.target.value } : m))
                          )
                        }
                        placeholder="Label (e.g. Hero image)"
                      />
                      <Input
                        value={item.src}
                        onChange={(e) =>
                          setMedia((prev) =>
                            prev.map((m) => (m.id === item.id ? { ...m, src: e.target.value } : m))
                          )
                        }
                        placeholder="/path/to/image.png"
                        className="font-mono text-xs"
                      />
                      <Input
                        value={item.alt}
                        onChange={(e) => updateMediaAlt(item.id, e.target.value)}
                        placeholder="Alt text — describe image naturally with relevant keywords"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setOgImage(item.src)}
                          disabled={!item.src}
                        >
                          Use as social image
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMedia((prev) => prev.filter((m) => m.id !== item.id))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="truncate text-sm text-[#1a0dab]">{title || name}</p>
              <p className="truncate text-xs text-[#006621]">{previewUrl}</p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {description || "Add a meta description to control your search snippet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social image (Open Graph)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                Image shown when this page is shared on social networks or in rich search results.
              </p>
              <Input
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="/path/to/og-image.png"
                className="font-mono text-xs"
              />
              {ogImage && (ogImage.startsWith("/") || ogImage.startsWith("http")) && (
                <div className="relative aspect-[1.91/1] w-full overflow-hidden rounded-lg border bg-gray-50">
                  <Image src={ogImage} alt="Social preview" fill className="object-cover" unoptimized={ogImage.startsWith("data:")} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminSeoEditPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Loading…</p>}>
      <SeoEditForm />
    </Suspense>
  );
}
