"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
    id: "",
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
  const [sizePrices, setSizePrices] = useState<Record<string, string>>({});
  const [sizeImages, setSizeImages] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate ID helper function
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    // Generate a default product ID only on initial mount
    if (!formData.id) {
      setFormData(prev => ({ ...prev, id: generateId() }));
    }
    fetchCategories();
    fetchSizeAttributes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          const uniqueSizes = Array.from(new Set(sizeAttribute.values)) as string[];
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

  const handleSizePriceChange = (size: string, price: string) => {
    setSizePrices((prev) => ({ ...prev, [size]: price }));
  };

  const handleSizeImageUpload = async (size: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imagePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read image file"));
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const imageUrls = await Promise.all(imagePromises);
      setSizeImages((prev) => ({
        ...prev,
        [size]: [...(prev[size] || []), ...imageUrls],
      }));
    } catch (error) {
      console.error("Failed to upload size images:", error);
      setError("Failed to upload images. Please try again.");
    }
  };

  const handleSizeImageRemove = (size: string, imageIndex: number) => {
    setSizeImages((prev) => ({
      ...prev,
      [size]: (prev[size] || []).filter((_, idx) => idx !== imageIndex),
    }));
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

    // Validate that selected sizes have prices and images
    if (selectedSizes.length === 0) {
      setError("Please select at least one size");
      return;
    }

    for (const size of selectedSizes) {
      if (!sizePrices[size] || parseFloat(sizePrices[size]) <= 0) {
        setError(`Please enter a valid price for size: ${size}`);
        return;
      }
      if (!sizeImages[size] || sizeImages[size].length === 0) {
        setError(`Please add at least one image for size: ${size}`);
        return;
      }
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

      // Convert selected sizes to new attributes format with prices and images
      const attributes = selectedSizes.length > 0 
        ? { 
            size: selectedSizes.map((size) => ({
              value: size,
              price: parseFloat(sizePrices[size]),
              images: sizeImages[size] || [],
            }))
          } 
        : null;

      // Use the first size's price as the base price (for compatibility)
      const basePrice = selectedSizes.length > 0 ? parseFloat(sizePrices[selectedSizes[0]]) : 0;

      // Always include ID - it should always be set (auto-generated on mount)
      const productId = formData.id.trim();
      
      // Ensure ID is present (should always be the case due to useEffect)
      if (!productId) {
        setError("Product ID is required. Please ensure an ID is generated.");
        setIsLoading(false);
        return;
      }
      
      const productData = {
        id: productId, // Always include ID
        name: formData.name,
        description: formData.description || null,
        price: basePrice,
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

      <form onSubmit={(e) => handleSubmit(e, "add")} className="space-y-6">
        {/* Basic Information Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product ID */}
              <div>
                <label
                  htmlFor="id"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Product ID
                </label>
                <Input
                  id="id"
                  placeholder="Product ID will be auto-generated"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  className="w-full font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A unique ID is automatically generated. You can edit any part of it as needed.
                </p>
              </div>

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
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                content={formData.description}
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="Enter product description... Use the toolbar to format your text."
              />
              <p className="mt-2 text-xs text-gray-500">
                Use the toolbar above to format your description with headings, lists, links, images, and more.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category & Organization Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Category & Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

        {/* Media & Variants Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Media Section */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">Product Media</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                These images will appear for all product attributes. Attribute-specific images (set below) will appear first, followed by these backup images.
              </p>
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

          {/* Sizes & Pricing Section */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">Sizes & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {availableSizes.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizes(selectedSizes.filter((s) => s !== size));
                              // Remove price and images for this size
                              setSizePrices((prev) => {
                                const updated = { ...prev };
                                delete updated[size];
                                return updated;
                              });
                              setSizeImages((prev) => {
                                const updated = { ...prev };
                                delete updated[size];
                                return updated;
                              });
                            } else {
                              setSelectedSizes([...selectedSizes, size]);
                              // Initialize price and images for this size
                              setSizePrices((prev) => ({ ...prev, [size]: "" }));
                              setSizeImages((prev) => ({ ...prev, [size]: [] }));
                            }
                          }}
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
                  <div className="space-y-4">
                    {selectedSizes.map((size) => (
                    <div
                      key={size}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {size}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSizes(selectedSizes.filter((s) => s !== size));
                            setSizePrices((prev) => {
                              const updated = { ...prev };
                              delete updated[size];
                              return updated;
                            });
                            setSizeImages((prev) => {
                              const updated = { ...prev };
                              delete updated[size];
                              return updated;
                            });
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Price Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sizePrices[size] || ""}
                          onChange={(e) => handleSizePriceChange(size, e.target.value)}
                          placeholder="0.00"
                          required
                          className="w-full text-sm"
                        />
                      </div>
                      
                      {/* Images for this size */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Images (at least one required)
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {sizeImages[size] && sizeImages[size].length > 0 ? (
                            sizeImages[size].map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                              >
                                <Image
                                  src={imgUrl}
                                  alt={`${size} image ${imgIdx + 1}`}
                                  fill
                                  sizes="(max-width: 768px) 33vw, 10vw"
                                  className="object-cover"
                                  unoptimized={imgUrl?.startsWith('data:') || imgUrl?.startsWith('blob:')}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSizeImageRemove(size, imgIdx)}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          ) : null}
                          {(!sizeImages[size] || sizeImages[size].length < 10) && (
                            <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleSizeImageUpload(size, e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-1">
                                Add Image
                              </span>
                            </label>
                          )}
                        </div>
                        {sizeImages[size] && sizeImages[size].length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {sizeImages[size].length} image{sizeImages[size].length !== 1 ? 's' : ''} uploaded
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isLoading ? "Creating..." : "Add Product"}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, "save")}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium"
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, "schedule")}
            disabled={isLoading}
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

