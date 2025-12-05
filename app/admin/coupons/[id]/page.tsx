"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minPurchaseAmount: string | null;
  maxDiscountAmount: string | null;
  minPurchaseIncludesDelivery: boolean;
  usageLimit: number | null;
  userUsageLimit: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  includedProducts: string[];
  excludedProducts: string[];
  includedCategories: string[];
  excludedCategories: string[];
}

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: "",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    minPurchaseIncludesDelivery: false,
    usageLimit: "",
    userUsageLimit: "",
    validFrom: "",
    validUntil: "",
    isActive: true,
    includedProducts: [] as string[],
    excludedProducts: [] as string[],
    includedCategories: [] as string[],
    excludedCategories: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=1000");
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.products || []));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?limit=1000");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : (data.categories || []));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCoupon();
    }
  }, [params.id]);

  const fetchCoupon = async () => {
    try {
      const res = await fetch(`/api/coupons/${params.id}`);
      if (res.ok) {
        const coupon: Coupon = await res.json();
        
        // Format dates for datetime-local input
        const formatDateForInput = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
        };

        setFormData({
          code: coupon.code || "",
          description: coupon.description || "",
          discountType: coupon.discountType || "PERCENTAGE",
          discountValue: coupon.discountValue?.toString() || "",
          minPurchaseAmount: coupon.minPurchaseAmount?.toString() || "",
          maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
          minPurchaseIncludesDelivery: coupon.minPurchaseIncludesDelivery || false,
          usageLimit: coupon.usageLimit?.toString() || "",
          userUsageLimit: coupon.userUsageLimit?.toString() || "",
          validFrom: formatDateForInput(coupon.validFrom),
          validUntil: coupon.validUntil
            ? formatDateForInput(coupon.validUntil)
            : "",
          isActive: coupon.isActive,
          includedProducts: coupon.includedProducts || [],
          excludedProducts: coupon.excludedProducts || [],
          includedCategories: coupon.includedCategories || [],
          excludedCategories: coupon.excludedCategories || [],
        });
      } else {
        setError("Coupon not found");
      }
    } catch (error) {
      console.error("Failed to fetch coupon:", error);
      setError("Failed to load coupon");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.code.trim()) {
      setError("Coupon code is required");
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    if (
      formData.discountType === "PERCENTAGE" &&
      parseFloat(formData.discountValue) > 100
    ) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    if (
      formData.minPurchaseAmount &&
      parseFloat(formData.minPurchaseAmount) < 0
    ) {
      setError("Minimum purchase amount cannot be negative");
      return;
    }

    if (
      formData.maxDiscountAmount &&
      parseFloat(formData.maxDiscountAmount) < 0
    ) {
      setError("Maximum discount amount cannot be negative");
      return;
    }

    if (formData.usageLimit && parseInt(formData.usageLimit) < 0) {
      setError("Usage limit cannot be negative");
      return;
    }

    if (formData.userUsageLimit && parseInt(formData.userUsageLimit) < 0) {
      setError("User usage limit cannot be negative");
      return;
    }

    if (
      formData.validUntil &&
      new Date(formData.validUntil) < new Date(formData.validFrom)
    ) {
      setError("Valid until date must be after valid from date");
      return;
    }

    setIsLoading(true);

    try {
      const couponData = {
        code: formData.code.trim(),
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: formData.minPurchaseAmount
          ? parseFloat(formData.minPurchaseAmount)
          : null,
        maxDiscountAmount: formData.maxDiscountAmount
          ? parseFloat(formData.maxDiscountAmount)
          : null,
        minPurchaseIncludesDelivery: formData.minPurchaseIncludesDelivery,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        userUsageLimit: formData.userUsageLimit
          ? parseInt(formData.userUsageLimit)
          : null,
        validFrom: formData.validFrom || new Date().toISOString(),
        validUntil: formData.validUntil || null,
        isActive: formData.isActive,
        includedProducts: formData.includedProducts,
        excludedProducts: formData.excludedProducts,
        includedCategories: formData.includedCategories,
        excludedCategories: formData.excludedCategories,
      };

      const res = await fetch(`/api/coupons/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData),
      });

      if (res.ok) {
        router.push("/admin/coupons");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update coupon");
      }
    } catch (error) {
      console.error("Failed to update coupon:", error);
      setError("An error occurred while updating the coupon");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Coupon
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Sales{" "}
          <span className="mx-2">&gt;</span> Coupons{" "}
          <span className="mx-2">&gt;</span> Edit Coupon
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6 space-y-6">
            {/* Coupon Code */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="code"
                placeholder="Enter coupon code (e.g., SAVE20)"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Code will be automatically converted to uppercase.
              </p>
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
                placeholder="Enter coupon description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Discount Type and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="discountType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as "PERCENTAGE" | "FIXED",
                    })
                  }
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="discountValue"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <Input
                  id="discountValue"
                  type="number"
                  step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                  min="0"
                  max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                  placeholder={
                    formData.discountType === "PERCENTAGE" ? "10" : "10.00"
                  }
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: e.target.value })
                  }
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.discountType === "PERCENTAGE"
                    ? "Enter percentage (0-100)"
                    : "Enter fixed amount"}
                </p>
              </div>
            </div>

            {/* Min Purchase Amount and Max Discount Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="minPurchaseAmount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Minimum Purchase Amount
                </label>
                <Input
                  id="minPurchaseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.minPurchaseAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPurchaseAmount: e.target.value,
                    })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum order amount to use this coupon (optional)
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.minPurchaseIncludesDelivery}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPurchaseIncludesDelivery: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Include delivery cost in minimum purchase amount
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="maxDiscountAmount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Maximum Discount Amount
                </label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value,
                    })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum discount cap (optional, mainly for percentage discounts)
                </p>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="usageLimit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Total Usage Limit
                </label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Total number of times this coupon can be used (leave empty for unlimited)
                </p>
              </div>

              <div>
                <label
                  htmlFor="userUsageLimit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Per User Usage Limit
                </label>
                <Input
                  id="userUsageLimit"
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={formData.userUsageLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userUsageLimit: e.target.value,
                    })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of times a single user can use this coupon (leave empty for unlimited)
                </p>
              </div>
            </div>

            {/* Valid From and Valid Until */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="validFrom"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Valid From <span className="text-red-500">*</span>
                </label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: e.target.value })
                  }
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="validUntil"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Valid Until
                </label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for no expiration date
                </p>
              </div>
            </div>

            {/* Product and Category Restrictions */}
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Product & Category Restrictions
              </h3>
              
              {/* Included Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Included Products
                </label>
                <select
                  onChange={(e) => {
                    const productId = e.target.value;
                    if (productId && !formData.includedProducts.includes(productId)) {
                      setFormData({
                        ...formData,
                        includedProducts: [...formData.includedProducts, productId],
                        excludedProducts: formData.excludedProducts.filter(id => id !== productId),
                      });
                    }
                    e.target.value = "";
                  }}
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a product to include...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {formData.includedProducts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.includedProducts.map((productId) => {
                      const product = products.find(p => p.id === productId);
                      return product ? (
                        <span
                          key={productId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          {product.name}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                includedProducts: formData.includedProducts.filter(id => id !== productId),
                              })
                            }
                            className="hover:text-blue-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Only these products will be eligible for the coupon. Leave empty to allow all products.
                </p>
              </div>

              {/* Excluded Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excluded Products
                </label>
                <select
                  onChange={(e) => {
                    const productId = e.target.value;
                    if (productId && !formData.excludedProducts.includes(productId)) {
                      setFormData({
                        ...formData,
                        excludedProducts: [...formData.excludedProducts, productId],
                        includedProducts: formData.includedProducts.filter(id => id !== productId),
                      });
                    }
                    e.target.value = "";
                  }}
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a product to exclude...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {formData.excludedProducts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.excludedProducts.map((productId) => {
                      const product = products.find(p => p.id === productId);
                      return product ? (
                        <span
                          key={productId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs"
                        >
                          {product.name}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                excludedProducts: formData.excludedProducts.filter(id => id !== productId),
                              })
                            }
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  These products will not be eligible for the coupon.
                </p>
              </div>

              {/* Included Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Included Categories
                </label>
                <select
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    if (categoryId && !formData.includedCategories.includes(categoryId)) {
                      setFormData({
                        ...formData,
                        includedCategories: [...formData.includedCategories, categoryId],
                        excludedCategories: formData.excludedCategories.filter(id => id !== categoryId),
                      });
                    }
                    e.target.value = "";
                  }}
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category to include...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formData.includedCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.includedCategories.map((categoryId) => {
                      const category = categories.find(c => c.id === categoryId);
                      return category ? (
                        <span
                          key={categoryId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          {category.name}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                includedCategories: formData.includedCategories.filter(id => id !== categoryId),
                              })
                            }
                            className="hover:text-blue-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Only products in these categories will be eligible for the coupon. Leave empty to allow all categories.
                </p>
              </div>

              {/* Excluded Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excluded Categories
                </label>
                <select
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    if (categoryId && !formData.excludedCategories.includes(categoryId)) {
                      setFormData({
                        ...formData,
                        excludedCategories: [...formData.excludedCategories, categoryId],
                        includedCategories: formData.includedCategories.filter(id => id !== categoryId),
                      });
                    }
                    e.target.value = "";
                  }}
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category to exclude...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formData.excludedCategories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.excludedCategories.map((categoryId) => {
                      const category = categories.find(c => c.id === categoryId);
                      return category ? (
                        <span
                          key={categoryId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs"
                        >
                          {category.name}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                excludedCategories: formData.excludedCategories.filter(id => id !== categoryId),
                              })
                            }
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Products in these categories will not be eligible for the coupon.
                </p>
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
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
              <p className="mt-1 text-xs text-gray-500">
                Inactive coupons cannot be used by customers
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isLoading ? "Updating..." : "Update Coupon"}
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/admin/coupons")}
            variant="outline"
            className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

