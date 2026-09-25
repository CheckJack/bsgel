"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  heroImage: string | null;
  author: string | null;
  status: BlogStatus;
  publishedAt: string | null;
}

export default function EditBlogPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const blogId = params.id as string;

  const [blog, setBlog] = useState<Blog | null>(null);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}`);
      if (res.ok) {
        const data = await res.json();
        setBlog(data);
        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          author: data.author || "",
          status: data.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        });
        if (data.image) {
          setImage({ url: data.image });
        }
        if (data.heroImage) {
          setHeroImage({ url: data.heroImage });
        }
      } else {
        setError(t("admin.blogs.notFound"));
      }
    } catch (fetchError) {
      console.error("Failed to fetch blog:", fetchError);
      setError(t("admin.blogs.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.slug.trim()) {
      setError(t("admin.blogs.titleSlugRequired"));
      return;
    }

    setIsSaving(true);

    try {
      const [imageUrl, heroImageUrl] = await Promise.all([
        resolveBlogImageForSave(image, blog?.image),
        resolveBlogImageForSave(heroImage, blog?.heroImage),
      ]);

      const blogData: Record<string, unknown> = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt || null,
        content: formData.content || "",
        author: formData.author || null,
        status: formData.status,
      };

      if (imageUrl !== undefined) {
        blogData.image = imageUrl;
      }

      if (heroImageUrl !== undefined) {
        blogData.heroImage = heroImageUrl;
      }

      const res = await fetch(`/api/blogs/${blogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push("/admin/blogs");
      } else {
        setError(data.error || t("admin.blogs.updateFailed"));
      }
    } catch (saveError) {
      console.error("Failed to update blog:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "An error occurred while updating the blog post. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || t("admin.blogs.notFound")}</p>
          <Button onClick={() => router.push("/admin/blogs")}>
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("admin.blogs.editTitle")}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Pages{" "}
          <span className="mx-2">&gt;</span> Blog Posts <span className="mx-2">&gt;</span> Edit
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly version of the title</p>
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
                <p className="mt-1 text-xs text-gray-500">
                  A brief summary that appears in blog listings
                </p>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Write your blog post content here... Use the toolbar to format your text."
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
                <p className="mt-1 text-xs text-gray-500">
                  Only published posts appear on the BioNews page.
                </p>
              </div>

              {blog.publishedAt && (
                <p className="text-xs text-gray-500">
                  First published: {new Date(blog.publishedAt).toLocaleString()}
                </p>
              )}

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
            inputId="blog-thumbnail-image-edit"
          />

          <BlogImageUpload
            title={t("admin.blogs.heroPhoto")}
            description="Shown as the full-width banner at the top of the article page only."
            image={heroImage}
            onImageChange={setHeroImage}
            inputId="blog-hero-image-edit"
          />

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSaving
                ? "Saving..."
                : formData.status === "PUBLISHED"
                ? "Update & Publish"
                : "Save Changes"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/admin/blogs")}
              disabled={isSaving}
              variant="outline"
              className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
