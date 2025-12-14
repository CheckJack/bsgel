"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Loader2, ArrowLeft, Search, X, Plus, Upload } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string | null;
}

interface SelectedProduct {
  productId: string;
  quantity: number;
  product: Product;
}

interface TrainingDay {
  day: number;
  hours: number;
  content: string;
  format: "ONLINE" | "PRESENTIAL" | "HYBRID";
}

interface ImagePreview {
  url: string;
  file?: File;
}

export default function EditTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [days, setDays] = useState<TrainingDay[]>([{ day: 1, hours: 8, content: "", format: "PRESENTIAL" }]);
  const [image, setImage] = useState<ImagePreview | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    price: "",
    image: "",
    isActive: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Close product selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProductSelector && !target.closest('.product-selector-container')) {
        setShowProductSelector(false);
      }
    };

    if (showProductSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProductSelector]);

  // Close product selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProductSelector && !target.closest('.product-selector-container')) {
        setShowProductSelector(false);
      }
    };

    if (showProductSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProductSelector]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=1000");
      if (res.ok) {
        const data = await res.json();
        const productsArray = Array.isArray(data) ? data : (data.products || []);
        setProducts(productsArray);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.some((sp) => sp.productId === product.id)) {
      toast("Product already added", "info");
      return;
    }
    setSelectedProducts([
      ...selectedProducts,
      {
        productId: product.id,
        quantity: 1,
        product,
      },
    ]);
    setSearchQuery("");
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((sp) => sp.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(
      selectedProducts.map((sp) =>
        sp.productId === productId ? { ...sp, quantity } : sp
      )
    );
  };

  const handleAddDay = () => {
    setDays([...days, { day: days.length + 1, hours: 8, content: "", format: "PRESENTIAL" }]);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) {
      toast("At least one day is required", "error");
      return;
    }
    const newDays = days.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
    setDays(newDays);
  };

  const handleDayChange = (index: number, field: keyof TrainingDay, value: any) => {
    const newDays = [...days];
    newDays[index] = { ...newDays[index], [field]: value };
    setDays(newDays);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please upload an image file", "error");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "upload");

      const res = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.url;
        setImage({ url: imageUrl, file });
        setFormData((prev) => ({ ...prev, image: imageUrl }));
        toast("Image uploaded successfully", "success");
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to upload image", "error");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast("Failed to upload image. Please try again.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  useEffect(() => {
    if (id) {
      fetchTraining();
    }
  }, [id]);

  const fetchTraining = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/trainings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title,
          description: data.description || "",
          content: data.content || "",
          price: data.price.toString(),
          image: data.image || "",
          isActive: data.isActive,
        });
        
        // Load image
        if (data.image) {
          setImage({ url: data.image });
        }
        
        // Load days
        if (data.days && Array.isArray(data.days) && data.days.length > 0) {
          setDays(data.days.map((d: any) => ({
            day: d.day || 1,
            hours: d.hours || 8,
            content: d.content || "",
            format: d.format || "PRESENTIAL",
          })));
        } else {
          // Default to one day if no days exist
          setDays([{ day: 1, hours: 8, content: "", format: "PRESENTIAL" }]);
        }
        
        // Load included products
        if (data.includedProducts && Array.isArray(data.includedProducts)) {
          setSelectedProducts(
            data.includedProducts.map((ip: any) => ({
              productId: ip.id,
              quantity: ip.quantity || 1,
              product: {
                id: ip.id,
                name: ip.name,
                price: ip.price.toString(),
                image: ip.image,
              },
            }))
          );
        }
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to load training program", "error");
        router.push("/admin/trainings");
      }
    } catch (error) {
      console.error("Failed to fetch training program:", error);
      toast("Failed to load training program. Please try again.", "error");
      router.push("/admin/trainings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/trainings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          content: formData.content || null,
          days: days,
          price: parseFloat(formData.price),
          image: formData.image || null,
          isActive: formData.isActive,
          productIds: selectedProducts.map((sp) => ({
            productId: sp.productId,
            quantity: sp.quantity,
          })),
        }),
      });

      if (res.ok) {
        toast("Training program updated successfully", "success");
        router.push("/admin/trainings");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update training program", "error");
      }
    } catch (error) {
      console.error("Failed to update training program:", error);
      toast("Failed to update training program. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Training Program
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Trainings{" "}
          <span className="mx-2">&gt;</span> Edit
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* General Overview */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                General Program Overview
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Overall program overview, learning objectives, prerequisites, what students will gain from this training..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                General overview of the program. Detailed day-by-day curriculum is added below.
              </p>
            </div>

            {/* Training Days */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Training Days <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  onClick={handleAddDay}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Day
                </Button>
              </div>
              <div className="space-y-4">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Day {day.day}
                      </h4>
                      {days.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDay(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hours <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={day.hours}
                          onChange={(e) =>
                            handleDayChange(index, "hours", parseInt(e.target.value) || 1)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Format
                        </label>
                        <select
                          value={day.format}
                          onChange={(e) =>
                            handleDayChange(index, "format", e.target.value as "ONLINE" | "PRESENTIAL" | "HYBRID")
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PRESENTIAL">Presential (In-Person)</option>
                          <option value="ONLINE">Online</option>
                          <option value="HYBRID">Hybrid</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Day Content/Curriculum
                      </label>
                      <textarea
                        value={day.content}
                        onChange={(e) => handleDayChange(index, "content", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What will be covered on this day..."
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total Hours: {days.reduce((sum, d) => sum + d.hours, 0)} hours
              </p>
            </div>

            {/* Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Price (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Training Program Image
              </label>
              
              {image ? (
                <div className="relative">
                  <img
                    src={image.url}
                    alt="Training program preview"
                    className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-8 w-8 text-gray-400 mb-2 animate-spin" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Uploading...
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Drop your image here or{" "}
                        <span className="text-blue-600 dark:text-blue-400 underline">click</span> to browse
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Included Products */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Included Products (Training Package)
              </label>
              
              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedProducts.map((sp) => (
                    <div
                      key={sp.productId}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {sp.product.image && (
                        <img
                          src={sp.product.image}
                          alt={sp.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {sp.product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          €{parseFloat(sp.product.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={sp.quantity}
                          onChange={(e) =>
                            handleQuantityChange(sp.productId, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(sp.productId)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Product Button */}
              <div className="relative product-selector-container">
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product to Training Package
                  </span>
                </button>

                {/* Product Selector Dropdown */}
                {showProductSelector && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No products found
                        </div>
                      ) : (
                        filteredProducts
                          .filter((p) => !selectedProducts.some((sp) => sp.productId === p.id))
                          .map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-3"
                            >
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  €{parseFloat(product.price).toFixed(2)}
                                </p>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Select products that are included in this training package
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active (visible to users)
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link href="/admin/trainings">
                <Button type="button" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

