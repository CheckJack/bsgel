"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

export default function EditAttributePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    category: "",
    values: [""],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttribute();
  }, [id]);

  const fetchAttribute = async () => {
    try {
      const res = await fetch(`/api/attributes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          category: data.category,
          values: data.values.length > 0 ? data.values : [""],
        });
      } else {
        setError("Failed to load attribute");
      }
    } catch (error) {
      console.error("Failed to fetch attribute:", error);
      setError("Failed to load attribute");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddValue = () => {
    setFormData({
      ...formData,
      values: [...formData.values, ""],
    });
  };

  const handleRemoveValue = (index: number) => {
    if (formData.values.length > 1) {
      setFormData({
        ...formData,
        values: formData.values.filter((_, i) => i !== index),
      });
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...formData.values];
    newValues[index] = value;
    setFormData({
      ...formData,
      values: newValues,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.category.trim()) {
      setError("Category name is required");
      return;
    }

    const validValues = formData.values
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (validValues.length === 0) {
      setError("At least one value is required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/attributes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formData.category.trim(),
          values: validValues,
        }),
      });

      if (res.ok) {
        router.push("/admin/attributes");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update attribute");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Failed to update attribute:", error);
      setError("Failed to update attribute. Please try again.");
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

  return (
    <div>
      {/* Header with Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attribute information</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Attributes{" "}
          <span className="mx-2">&gt;</span> Edit attribute
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
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category name <span className="text-red-500">*</span>
              </label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                placeholder="e.g., Color, Size, Material"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Values field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Values <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {formData.values.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder={`Value ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                    {formData.values.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddValue}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Plus className="h-4 w-4" />
                Add value
              </button>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 px-8"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

