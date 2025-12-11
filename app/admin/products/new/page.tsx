"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  subcategories?: Category[];
}

interface ImagePreview {
  url: string;
  file?: File;
  type: 'image' | 'video';
}

export default function NewProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    subcategoryIds: [] as string[],
    showcasingSections: [] as string[],
  });

  // Available showcasing sections
  const showcasingSections = [
    { value: "treatment-gels", label: "Treatment Gels" },
    { value: "treatment-base-gels", label: "Treatment Base Gels" },
    { value: "color-gels", label: "Color Gels (Bio Gel)" },
    { value: "evo-color-gels", label: "Color Gels (Evo)" },
    { value: "top-coats", label: "Top Coats" },
    { value: "hand-care", label: "Hand Care" },
    { value: "foot-care", label: "Foot Care" },
    { value: "reds", label: "Reds" },
    { value: "pinks", label: "Pinks" },
    { value: "nudes", label: "Nudes" },
    { value: "oranges", label: "Oranges" },
  ];
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchSizeAttributes();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch all categories (no pagination limit)
      const res = await fetch("/api/categories?limit=1000");
      if (res.ok) {
        const data = await res.json();
        // API returns { categories: [], pagination: {} }
        // The API already returns all categories (both main and subcategories) in a flat list
        // We just need to use them directly
        const allCategories = data.categories || data || [];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]); // Set empty array on error
    }
  };

  const fetchSizeAttributes = async () => {
    try {
      const res = await fetch("/api/attributes");
      if (res.ok) {
        const data = await res.json();
        const attributes = data.attributes || [];
        // Find the "size" attribute
        const sizeAttribute = attributes.find(
          (attr: any) => attr.category.toLowerCase() === "size"
        );
        if (sizeAttribute && Array.isArray(sizeAttribute.values)) {
          // Remove duplicates and set the sizes
          const uniqueSizes = Array.from(new Set(sizeAttribute.values));
          setAvailableSizes(uniqueSizes);
        } else {
          // Fallback to empty array if no size attribute found
          setAvailableSizes([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch size attributes:", error);
      setAvailableSizes([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith("video/") ? 'video' : 'image';
        setImages((prev) => [...prev, { url, file, type }]);
      }
    });
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith("video/") ? 'video' : 'image';
        setImages((prev) => [...prev, { url, file, type }]);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent, action: "add" | "save" | "schedule") => {
    e.preventDefault();
    setError("");

    if (formData.name.length > 20) {
      setError("Product name cannot exceed 20 characters");
      return;
    }

    if (formData.description.length > 100) {
      setError("Description cannot exceed 100 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Convert image files to base64 for storage
      // In production, upload to cloud storage (S3/Cloudinary/etc.) instead
      const imagePromises = images.map((img) => {
        if (img.file) {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              reject(new Error("Failed to read image file"));
            };
            reader.readAsDataURL(img.file!);
          });
        } else {
          // If it's already a URL (not a file), use it directly
          return Promise.resolve(img.url);
        }
      });

      const imageUrls = await Promise.all(imagePromises);

      // Convert selected sizes to attributes format
      const attributes = selectedSizes.length > 0 ? { size: selectedSizes } : null;

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image: imageUrls[0] || null,
        images: imageUrls.slice(1),
        categoryId: formData.categoryId || null,
        subcategoryIds: formData.subcategoryIds || [],
        featured: false,
        attributes,
        showcasingSections: formData.showcasingSections || [],
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        if (action === "schedule") {
          // Handle schedule action (save as draft or schedule for later)
          router.push("/admin/products");
        } else {
          router.push("/admin/products");
        }
      } else {
        const data = await res.json();
        const errorMessage = data.details 
          ? `${data.error || "Failed to create product"}: ${data.details}`
          : (data.error || "Failed to create product");
        console.error("Product creation error:", data);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to process images:", error);
      setError("An error occurred while processing images. Please try again.");
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add Product</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Ecommerce{" "}
          <span className="mx-2">&gt;</span> Add product
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, "add")} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Product Details */}
        <div className="space-y-6">
          <Card className="bg-white">
            <CardContent className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Product name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  maxLength={20}
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Do not exceed 20 characters when entering the product name.
                </p>
                {formData.name.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.name.length}/20 characters
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value, subcategoryIds: [] })
                  }
                  required
                >
                  <option value="">Choose category</option>
                  {categories.filter((cat) => !cat.parentId).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategories (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select one or more subcategories for this product
                </p>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No categories available</p>
                  ) : (
                    (() => {
                      // Filter to only show actual subcategories (categories with parentId)
                      const subcategories = categories.filter((cat) => cat.parentId);
                      return subcategories.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No subcategories available. Create subcategories in the Categories section first.</p>
                      ) : (
                        subcategories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.subcategoryIds.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    subcategoryIds: [...formData.subcategoryIds, category.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    subcategoryIds: formData.subcategoryIds.filter((id) => id !== category.id),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{category.name}</span>
                          </label>
                        ))
                      );
                    })()
                  )}
                </div>
                {formData.subcategoryIds.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formData.subcategoryIds.length} subcategor{formData.subcategoryIds.length === 1 ? "y" : "ies"} selected
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={100}
                  required
                  className="flex min-h-[120px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Do not exceed 100 characters when entering the product name.
                </p>
                {formData.description.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.description.length}/100 characters
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>

              {/* Showcasing Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Showcasing Sections
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select which showcasing pages this product should appear on
                </p>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                  {showcasingSections.map((section) => (
                    <label
                      key={section.value}
                      className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.showcasingSections.includes(section.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              showcasingSections: [...formData.showcasingSections, section.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              showcasingSections: formData.showcasingSections.filter((id) => id !== section.value),
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{section.label}</span>
                    </label>
                  ))}
                </div>
                {formData.showcasingSections.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formData.showcasingSections.length} section{formData.showcasingSections.length === 1 ? "" : "s"} selected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media & Size */}
        <div className="flex flex-col h-full">
          <div className="space-y-6 flex-1">
            {/* Upload Images */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Upload images
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Display up to 3 images in slots */}
                {Array.from({ length: 3 }).map((_, index) => {
                  const image = images[index];
                  return image ? (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                    >
                      {image.type === 'video' ? (
                        <video
                          src={image.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <Image
                          src={image.url}
                          alt={`Product image ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {image.type === 'video' && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Video
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={index}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700"
                    >
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                        Drop your images here or select click to browse
                      </p>
                    </div>
                  );
                })}
              </div>
              {/* Additional upload area if more than 3 images needed */}
              {images.length >= 3 && images.length < 12 && (
                <div className="relative mb-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 text-center">
                      Drop your images here or select click to browse
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Images and videos are optional. Pay attention to the quality
                of the media you add, comply with the background color
                standards. Media must be in certain dimensions. Notice that
                the product shows all the details. The first image/video will be displayed initially, and on hover it will fade to the next media item.
              </p>
              {images.length > 0 && (
                <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {images.length} media file{images.length !== 1 ? 's' : ''} uploaded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Size */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Add size
              </h3>
              {availableSizes.length > 0 ? (
                <>
                  <div className="mb-4">
                    <select
                      value={selectedSize}
                      onChange={(e) => {
                        const size = e.target.value;
                        if (size && !selectedSizes.includes(size)) {
                          setSelectedSizes([...selectedSizes, size]);
                          setSelectedSize("");
                        } else {
                          setSelectedSize(size);
                        }
                      }}
                      className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a size</option>
                      {availableSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No size attributes available. Please add size attributes in the Attributes section.
                </p>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Action Buttons - At the bottom */}
          <div className="flex flex-row gap-3 mt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isLoading ? "Creating..." : "Add product"}
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, "save")}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium"
            >
              Save product
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, "schedule")}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium"
            >
              Schedule
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

