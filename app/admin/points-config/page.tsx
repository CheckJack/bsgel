"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, X, Save, Check } from "lucide-react";
import Link from "next/link";

interface PointsConfig {
  id: string;
  actionType: string;
  pointsAmount: number | null;
  tieredConfig: any;
  minOrderValue: number | null;
  maxPointsPerTransaction: number | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
}

export default function PointsConfigPage() {
  const [configs, setConfigs] = useState<PointsConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    actionType: "REFERRAL_SIGNUP",
    pointsAmount: "",
    tieredConfig: null,
    minOrderValue: "",
    maxPointsPerTransaction: "",
    isActive: true,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/points-config");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/points-config/${editingId}`
        : "/api/admin/points-config";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        ...formData,
        pointsAmount: formData.pointsAmount ? parseInt(formData.pointsAmount) : null,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
        maxPointsPerTransaction: formData.maxPointsPerTransaction
          ? parseInt(formData.maxPointsPerTransaction)
          : null,
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
          actionType: "REFERRAL_SIGNUP",
          pointsAmount: "",
          tieredConfig: null,
          minOrderValue: "",
          maxPointsPerTransaction: "",
          isActive: true,
          validFrom: new Date().toISOString().split("T")[0],
          validUntil: "",
        });
        fetchConfigs();
      }
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleEdit = (config: PointsConfig) => {
    setEditingId(config.id);
    setFormData({
      actionType: config.actionType,
      pointsAmount: config.pointsAmount?.toString() || "",
      tieredConfig: config.tieredConfig,
      minOrderValue: config.minOrderValue?.toString() || "",
      maxPointsPerTransaction: config.maxPointsPerTransaction?.toString() || "",
      isActive: config.isActive,
      validFrom: new Date(config.validFrom).toISOString().split("T")[0],
      validUntil: config.validUntil ? new Date(config.validUntil).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      const res = await fetch(`/api/admin/points-config/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error("Failed to delete config:", error);
    }
  };

  const actionTypeLabels: Record<string, string> = {
    REFERRAL_SIGNUP: "Referral Signup",
    REFERRAL_FIRST_ORDER: "Referral First Order",
    REFERRAL_REPEAT_ORDER: "Referral Repeat Order",
    OWN_PURCHASE: "Own Purchase",
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Points Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure how points are awarded for different actions</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editingId ? "Edit Rule" : "New Rule"}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  actionType: "REFERRAL_SIGNUP",
                  pointsAmount: "",
                  tieredConfig: null,
                  minOrderValue: "",
                  maxPointsPerTransaction: "",
                  isActive: true,
                  validFrom: new Date().toISOString().split("T")[0],
                  validUntil: "",
                });
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Action Type</label>
                <select
                  value={formData.actionType}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {Object.entries(actionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Points Amount (Fixed)</label>
                <Input
                  type="number"
                  value={formData.pointsAmount}
                  onChange={(e) => setFormData({ ...formData, pointsAmount: e.target.value })}
                  placeholder="Enter fixed points amount"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if using tiered config</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Minimum Order Value (€)</label>
                <Input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  placeholder="Optional minimum order value"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Points Per Transaction</label>
                <Input
                  type="number"
                  value={formData.maxPointsPerTransaction}
                  onChange={(e) => setFormData({ ...formData, maxPointsPerTransaction: e.target.value })}
                  placeholder="Optional cap on points"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valid From</label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid Until (Optional)</label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active</label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{actionTypeLabels[config.actionType] || config.actionType}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {config.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Points</p>
                  <p className="font-medium">
                    {config.pointsAmount !== null
                      ? `${config.pointsAmount} points`
                      : "Tiered"}
                  </p>
                </div>
                {config.minOrderValue && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Min Order</p>
                    <p className="font-medium">€{Number(config.minOrderValue).toFixed(2)}</p>
                  </div>
                )}
                {config.maxPointsPerTransaction && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Max Points</p>
                    <p className="font-medium">{config.maxPointsPerTransaction}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Valid Until</p>
                  <p className="font-medium">
                    {config.validUntil
                      ? new Date(config.validUntil).toLocaleDateString()
                      : "No expiry"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configs.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No points configuration rules yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

