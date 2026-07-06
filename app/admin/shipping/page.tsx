"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface ShippingZone {
  id: string;
  name: string;
  postalCodeStart: number;
  postalCodeEnd: number;
  shippingCost: string;
  freeShippingThreshold: string | null;
  isActive: boolean;
}

const formatPostal7 = (value: number | string): string => {
  const digits = String(value).replace(/\D/g, "").slice(0, 7);
  if (digits.length !== 7) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

export default function ShippingConfigPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    postalCodeStart: "",
    postalCodeEnd: "",
    shippingCost: "",
    freeShippingThreshold: "",
    isActive: true,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const zonesRes = await fetch("/api/admin/shipping/zones");
      if (zonesRes.ok) {
        setZones(await zonesRes.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      postalCodeStart: "",
      postalCodeEnd: "",
      shippingCost: "",
      freeShippingThreshold: "",
      isActive: true,
    });
    setError("");
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const startDigits = formData.postalCodeStart.replace(/\D/g, "");
    const endDigits = formData.postalCodeEnd.replace(/\D/g, "");
    if (startDigits.length !== 7 || endDigits.length !== 7) {
      setError("Postal start/end must be complete 7-digit codes (e.g. 2685-005).");
      return;
    }

    const payload = {
      name: formData.name,
      postalCodeStart: Number(startDigits),
      postalCodeEnd: Number(endDigits),
      shippingCost: Number(formData.shippingCost),
      freeShippingThreshold:
        formData.freeShippingThreshold.trim() === ""
          ? null
          : Number(formData.freeShippingThreshold),
      isActive: formData.isActive,
    };

    const res = await fetch(
      editingId ? `/api/admin/shipping/zones/${editingId}` : "/api/admin/shipping/zones",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save shipping zone");
      return;
    }

    resetForm();
    loadData();
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingId(zone.id);
    setShowForm(true);
    setFormData({
      name: zone.name,
      postalCodeStart: formatPostal7(zone.postalCodeStart),
      postalCodeEnd: formatPostal7(zone.postalCodeEnd),
      shippingCost: String(zone.shippingCost),
      freeShippingThreshold: zone.freeShippingThreshold
        ? String(zone.freeShippingThreshold)
        : "",
      isActive: zone.isActive,
    });
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this shipping zone?")) return;
    await fetch(`/api/admin/shipping/zones/${id}`, { method: "DELETE" });
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white" />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shipping Configuration (Portugal)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define shipping prices by postal code range and zone-specific free-shipping promos.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Shipping zones</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add zone
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit shipping zone" : "Add shipping zone"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveZone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Zone name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Postal start (7 digits)</label>
                  <Input
                    type="text"
                    value={formData.postalCodeStart}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        postalCodeStart: e.target.value.replace(/[^\d-]/g, "").slice(0, 8),
                      }))
                    }
                    placeholder="2685-005"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal end (7 digits)</label>
                  <Input
                    type="text"
                    value={formData.postalCodeEnd}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        postalCodeEnd: e.target.value.replace(/[^\d-]/g, "").slice(0, 8),
                      }))
                    }
                    placeholder="2799-999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shipping cost (EUR)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, shippingCost: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Free shipping from (EUR, optional)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.freeShippingThreshold}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, freeShippingThreshold: e.target.value }))
                    }
                    placeholder="e.g. 150"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save zone
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configured zones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="p-3 border rounded-md flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatPostal7(zone.postalCodeStart)} - {formatPostal7(zone.postalCodeEnd)} • {Number(zone.shippingCost).toFixed(2)} EUR
                    {!zone.isActive ? " • Inactive" : ""}
                  </p>
                  {zone.freeShippingThreshold && (
                    <p className="text-sm text-green-700">
                      Free shipping from {Number(zone.freeShippingThreshold).toFixed(2)} EUR
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(zone)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeactivate(zone.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {zones.length === 0 && (
              <p className="text-sm text-gray-500">No zones configured yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
