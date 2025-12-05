"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload } from "lucide-react";

interface ImagePreview {
  url: string;
  file?: File;
}

export default function NewBlogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  });
  const [image, setImage] = useState<ImagePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImage({ url, file });
    }
  };

  const handleImageRemove = () => {
    if (image) {
      URL.revokeObjectURL(image.url);
      setImage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImage({ url, file });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.slug) {
      setError("Title and slug are required");
      return;
    }

    setIsLoading(true);

    try {
      // Convert image file to base64 for storage
      let imageUrl = null;
      if (image?.file) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error("Failed to read image file"));
          };
          reader.readAsDataURL(image.file!);
        });
      }

      const blogData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content || "",
        image: imageUrl,
        author: formData.author || null,
        status: formData.status,
        publishedAt: formData.status === "PUBLISHED" ? new Date().toISOString() : null,
      };

      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });

      if (res.ok) {
        router.push("/admin/blogs");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create blog post");
      }
    } catch (error) {
      console.error("Failed to create blog:", error);
      setError("An error occurred while creating the blog post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Blog Post</h1>
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
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="Enter blog post title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full"
                />
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  id="slug"
                  placeholder="blog-post-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                  }
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL-friendly version of the title (auto-generated from title)
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <label
                  htmlFor="excerpt"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Excerpt
                </label>
                <Textarea
                  id="excerpt"
                  placeholder="Short description of the blog post"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={3}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A brief summary that appears in blog listings
                </p>
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Content <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Write your blog post content here... Use the toolbar to format your text."
                />
                <p className="mt-2 text-xs text-gray-500">
                  Use the toolbar above to format your content with headings, lists, links, images, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Publish Settings
              </h3>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>

              {/* Author */}
              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Author
                </label>
                <Input
                  id="author"
                  placeholder="Author name"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Featured Image
              </h3>
              {image ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  <Image
                    src={image.url}
                    alt="Featured image"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="relative w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                    Drop your image here or click to browse
                  </p>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Featured image will be displayed in blog listings and at the top of the post.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isLoading ? "Creating..." : formData.status === "PUBLISHED" ? "Publish Post" : "Save Draft"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/admin/blogs")}
              disabled={isLoading}
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

