"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

interface ImagePreview {
  url: string;
  file?: File;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    parentId: "",
  });
  const [image, setImage] = useState<ImagePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategory();
    fetchParentCategories();
  }, [params.id]);

  const fetchParentCategories = async () => {
    try {
      const res = await fetch("/api/categories?limit=10000");
      if (res.ok) {
        const data = await res.json();
        const categoriesList = data.categories || data || [];
        // Filter to only show main categories (no parentId) as potential parents
        // Also exclude the current category to prevent self-reference
        const mainCategories = categoriesList.filter(
          (cat: any) => !cat.parentId && cat.id !== params.id
        );
        setParentCategories(mainCategories);
      }
    } catch (error) {
      console.error("Failed to fetch parent categories:", error);
    }
  };

  const fetchCategory = async () => {
    try {
      setIsFetching(true);
      const res = await fetch(`/api/categories/${params.id}`);
      if (res.ok) {
        const category = await res.json();
        setFormData({
          name: category.name || "",
          slug: category.slug || "",
          description: category.description || "",
          icon: category.icon || "",
          parentId: category.parentId || "",
        });

        // Load existing image
        if (category.image) {
          setImage({ url: category.image });
        }
      } else {
        setError("Failed to load category");
      }
    } catch (error) {
      console.error("Failed to fetch category:", error);
      setError("Failed to load category");
    } finally {
      setIsFetching(false);
    }
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Only auto-generate slug if it hasn't been manually edited
    const newSlug = slugManuallyEdited ? formData.slug : generateSlug(name);
    setFormData({
      ...formData,
      name,
      slug: newSlug,
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setFormData({
      ...formData,
      slug: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsLoading(true);

    try {
      // Convert image file to base64 for storage if it's a new file
      // If it's already a URL (existing image), use it directly
      let imageUrl = image?.url;

      if (image?.file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          await updateCategory(base64String);
        };
        reader.onerror = () => {
          setError("Failed to read image file");
          setIsLoading(false);
        };
        reader.readAsDataURL(image.file);
      } else {
        // If it's already a URL (not a file), use it directly
        await updateCategory(imageUrl || null);
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      setError("Failed to update category. Please try again.");
      setIsLoading(false);
    }
  };

  const updateCategory = async (imageUrl: string | null) => {
    try {
      // Ensure slug is always normalized (lowercase)
      const finalSlug = (formData.slug || generateSlug(formData.name)).toLowerCase().trim();

      const res = await fetch(`/api/categories/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: finalSlug,
          description: formData.description || null,
          image: imageUrl,
          icon: formData.icon || null,
          parentId: formData.parentId || null,
        }),
      });

      if (res.ok) {
        router.push("/admin/categories");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update category");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      setError("Failed to update category. Please try again.");
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit category</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Category{" "}
          <span className="mx-2">&gt;</span> Edit category
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            {/* Category name field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                required
                placeholder="Category name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Slug field */}
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Slug
              </label>
              <input
                id="slug"
                type="text"
                value={formData.slug || generateSlug(formData.name)}
                onChange={handleSlugChange}
                placeholder="Auto-generated from name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The slug is auto-generated from the name. You can edit it manually if needed.
              </p>
            </div>

            {/* Description field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Category description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Icon field */}
            <div>
              <label
                htmlFor="icon"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Icon (emoji)
              </label>
              <input
                id="icon"
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="📦"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 text-2xl"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter an emoji to represent this category (optional).
              </p>
            </div>

            {/* Parent Category field (for creating/editing subcategories) */}
            <div>
              <label
                htmlFor="parentId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Parent Category (Optional)
              </label>
              <select
                id="parentId"
                value={formData.parentId}
                onChange={(e) =>
                  setFormData({ ...formData, parentId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Main Category)</option>
                {parentCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select a parent category to make this a subcategory. Leave empty to make it a main category.
              </p>
            </div>

            {/* Upload images field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload image
              </label>
              {image ? (
                <div className="relative w-full h-48 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-700">
                  <Image
                    src={image.url}
                    alt="Category preview"
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
                  className="relative w-full h-48 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="h-10 w-10 text-blue-500 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-4">
                    Drop your image here or select{" "}
                    <span className="text-blue-500 cursor-pointer">click to browse</span>
                  </p>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-4 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/categories")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 px-8"
              >
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

