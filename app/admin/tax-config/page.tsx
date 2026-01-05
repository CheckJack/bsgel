"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";

interface TaxRegion {
  id: string;
  name: string;
  taxRate: number;
  postalCodePatterns: string[];
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TaxConfigPage() {
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    taxRate: "",
    postalCodePatterns: "",
    isActive: true,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTaxRegions();
  }, []);

  const fetchTaxRegions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/tax-config");
      if (res.ok) {
        const data = await res.json();
        setTaxRegions(data);
      }
    } catch (error) {
      console.error("Failed to fetch tax regions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Parse postal code patterns (comma-separated)
    const patterns = formData.postalCodePatterns
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (patterns.length === 0) {
      setError("At least one postal code pattern is required");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/tax-config/${editingId}`
        : "/api/admin/tax-config";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: formData.name,
        taxRate: parseFloat(formData.taxRate),
        postalCodePatterns: patterns,
        isActive: formData.isActive,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: "",
          taxRate: "",
          postalCodePatterns: "",
          isActive: true,
          validFrom: new Date().toISOString().split("T")[0],
          validUntil: "",
        });
        setError("");
        fetchTaxRegions();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to save tax region");
      }
    } catch (error) {
      console.error("Failed to save tax region:", error);
      setError("Failed to save tax region");
    }
  };

  const handleEdit = (region: TaxRegion) => {
    setEditingId(region.id);
    setFormData({
      name: region.name,
      taxRate: region.taxRate.toString(),
      postalCodePatterns: region.postalCodePatterns.join(", "),
      isActive: region.isActive,
      validFrom: new Date(region.validFrom).toISOString().split("T")[0],
      validUntil: region.validUntil ? new Date(region.validUntil).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this tax region?")) return;

    try {
      const res = await fetch(`/api/admin/tax-config/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTaxRegions();
      }
    } catch (error) {
      console.error("Failed to delete tax region:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      taxRate: "",
      postalCodePatterns: "",
      isActive: true,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: "",
    });
    setError("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tax Configuration</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tax Region
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Tax Region" : "Add Tax Region"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Region Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mainland Portugal, Madeira, Azores"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  placeholder="e.g., 23.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Postal Code Patterns * (comma-separated)
                </label>
                <Input
                  value={formData.postalCodePatterns}
                  onChange={(e) => setFormData({ ...formData, postalCodePatterns: e.target.value })}
                  placeholder="e.g., 1*, 2*, 3*, 4*, 5*, 6*, 7*, 8*"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use wildcards like &quot;1*&quot; for all codes starting with 1, &quot;90*&quot; for codes starting with 90, etc.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From *</label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until (optional)</label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tax Regions</CardTitle>
        </CardHeader>
        <CardContent>
          {taxRegions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tax regions configured</p>
          ) : (
            <div className="space-y-4">
              {taxRegions.map((region) => (
                <div
                  key={region.id}
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{region.name}</h3>
                      {region.isActive ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Tax Rate: <span className="font-semibold">{region.taxRate}%</span>
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Patterns: <span className="font-mono">{region.postalCodePatterns.join(", ")}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Valid from: {new Date(region.validFrom).toLocaleDateString()}
                      {region.validUntil && ` until ${new Date(region.validUntil).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(region)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(region.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

