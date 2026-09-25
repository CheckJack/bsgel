"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent } from "@/components/ui/card";
import { BlogImageUpload } from "@/components/admin/blog-image-upload";
import { useLanguage } from "@/contexts/language-context";
import {
  resolveBlogImageForSave,
  type ImagePreview,
} from "@/lib/blog-images";

type BlogStatus = "DRAFT" | "PUBLISHED";

export default function NewBlogPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    status: "DRAFT" as BlogStatus,
  });
  const [image, setImage] = useState<ImagePreview | null>(null);
  const [heroImage, setHeroImage] = useState<ImagePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (formData.title && !slugTouched) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, slugTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.slug.trim()) {
      setError(t("admin.blogs.titleSlugRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const [imageUrl, heroImageUrl] = await Promise.all([
        resolveBlogImageForSave(image, null),
        resolveBlogImageForSave(heroImage, null),
      ]);

      const blogData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt || null,
        content: formData.content || "",
        image: imageUrl ?? null,
        heroImage: heroImageUrl ?? null,
        author: formData.author || null,
        status: formData.status,
      };

      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push("/admin/blogs");
      } else {
        setError(data.error || t("admin.blogs.createFailed"));
      }
    } catch (createError) {
      console.error("Failed to create blog:", createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "An error occurred while creating the blog post. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("admin.blogs.newTitle")}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Pages{" "}
          <span className="mx-2">&gt;</span> Blog Posts <span className="mx-2">&gt;</span> New
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  placeholder={t("admin.blogs.titlePlaceholder")}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  id="slug"
                  placeholder="blog-post-slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    });
                  }}
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL-friendly version of the title (auto-generated until you edit it)
                </p>
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt
                </label>
                <Textarea
                  id="excerpt"
                  placeholder={t("admin.blogs.excerptPlaceholder")}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder={t("admin.blogs.contentPlaceholder")}
                  imageUploadHint="Recommended size: 1200 × 675 px (16:9). Images are uploaded to the server (max 8 MB)."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Publish Settings
              </h3>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as BlogStatus })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author
                </label>
                <Input
                  id="author"
                  placeholder={t("admin.blogs.authorPlaceholder")}
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <BlogImageUpload
            title={t("admin.blogs.thumbnail")}
            description={t("admin.blogs.thumbnailHint")}
            image={image}
            onImageChange={setImage}
            inputId="blog-thumbnail-image"
          />

          <BlogImageUpload
            title={t("admin.blogs.heroPhoto")}
            description="Shown as the full-width banner at the top of the article page only."
            image={heroImage}
            onImageChange={setHeroImage}
            inputId="blog-hero-image"
          />

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isLoading
                ? t("common.creating")
                : formData.status === "PUBLISHED"
                ? t("admin.blogs.publishPost")
                : t("admin.blogs.saveDraft")}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/admin/blogs")}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
