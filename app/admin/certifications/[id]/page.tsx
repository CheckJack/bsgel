"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Certification {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export default function EditCertificationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [certification, setCertification] = useState<Certification | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    categoryIds: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchCertification();
      fetchCategories();
    }
  }, [id]);

  const fetchCertification = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/certifications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCertification(data);
        setFormData({
          name: data.name,
          description: data.description || "",
          isActive: data.isActive,
          categoryIds: data.categories.map((c: { id: string }) => c.id),
        });
      } else {
        setError("Failed to load certification");
      }
    } catch (error) {
      console.error("Failed to fetch certification:", error);
      setError("Failed to load certification");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?limit=1000");
      if (res.ok) {
        const data = await res.json();
        const categoriesArray = Array.isArray(data.categories)
          ? data.categories
          : Array.isArray(data)
          ? data
          : [];
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Certification name is required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/certifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          categoryIds: formData.categoryIds,
        }),
      });

      if (res.ok) {
        router.push("/admin/certifications");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update certification");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Failed to update certification:", error);
      setError("Failed to update certification. Please try again.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Certification not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Certification
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Certifications{" "}
          <span className="mx-2">&gt;</span> Edit
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Professional, Initiation, Advanced"
                required
                className="w-full"
              />
            </div>

            {/* Description */}
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
                placeholder="Enter a description for this certification..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                Inactive certifications cannot be assigned to users
              </p>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Allowed Categories
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select the product categories that users with this certification can purchase from
              </p>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No categories available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.categoryIds.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.categoryIds.length} categor{formData.categoryIds.length === 1 ? "y" : "ies"} selected
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

