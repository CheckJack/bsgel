"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

export default function NewAttributePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: "",
    value: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.category.trim()) {
      setError("Attribute name is required");
      return;
    }

    if (!formData.value.trim()) {
      setError("Attribute value is required");
      return;
    }

    setIsLoading(true);

    try {
      // Check if attribute category already exists
      const checkRes = await fetch("/api/attributes");
      const checkData = await checkRes.json();
      const existingAttribute = checkData.attributes?.find(
        (attr: any) => attr.category.toLowerCase() === formData.category.trim().toLowerCase()
      );

      let attribute;
      if (existingAttribute) {
        // Update existing attribute by adding the new value
        const updatedValues = [...existingAttribute.values, formData.value.trim()];
        const updateRes = await fetch(`/api/attributes/${existingAttribute.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: existingAttribute.category,
            values: updatedValues,
          }),
        });

        if (!updateRes.ok) {
          const data = await updateRes.json();
          const errorMsg = data.error || "Failed to add attribute value";
          setError(errorMsg);
          toast(errorMsg, "error");
          setIsLoading(false);
          return;
        }
        toast(`Value added to "${existingAttribute.category}" successfully`, "success");
      } else {
        // Create new attribute
        const res = await fetch("/api/attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: formData.category.trim(),
            values: [formData.value.trim()],
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          const errorMsg = data.error || "Failed to create attribute";
          setError(errorMsg);
          toast(errorMsg, "error");
          setIsLoading(false);
          return;
        }
        toast(`Attribute "${formData.category.trim()}" created successfully`, "success");
      }

      router.push("/admin/attributes");
    } catch (error) {
      console.error("Failed to create attribute:", error);
      const errorMsg = "Failed to create attribute. Please try again.";
      setError(errorMsg);
      toast(errorMsg, "error");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header with Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add Attribute</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Attributes{" "}
          <span className="mx-2">&gt;</span> Add Attribute
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

            {/* Attribute name field */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="category"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[140px]"
              >
                Attribute name
              </label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                placeholder="Attribute name"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Attribute value field */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="value"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[140px]"
              >
                Attribute value
              </label>
              <input
                id="value"
                type="text"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                required
                placeholder="Attribute value"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Save button */}
            <div className="flex justify-start pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 px-8"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

