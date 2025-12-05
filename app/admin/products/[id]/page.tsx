"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ImagePreview {
  url: string;
  file?: File;
  type: 'image' | 'video';
}

interface Attribute {
  id: string;
  category: string;
  values: string[];
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: "",
    featured: false,
  });
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [productAttributes, setProductAttributes] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
    fetchProduct();
  }, [params.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        // API returns { categories: [], pagination: {} }
        setCategories(data.categories || data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]); // Set empty array on error
    }
  };

  const fetchAttributes = async () => {
    try {
      const res = await fetch("/api/attributes");
      if (res.ok) {
        const data = await res.json();
        const attributesArray = data.attributes || [];
        setAttributes(attributesArray);
      }
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
      setAttributes([]);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`);
      if (res.ok) {
        const product = await res.json();
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          image: product.image || "",
          categoryId: product.categoryId || "",
          featured: product.featured || false,
        });
        
        // Load existing images
        const existingImages: ImagePreview[] = [];
        const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith('data:video/');
        if (product.image) {
          existingImages.push({ url: product.image, type: isVideo(product.image) ? 'video' : 'image' });
        }
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((img: string) => {
            if (img) {
              existingImages.push({ url: img, type: isVideo(img) ? 'video' : 'image' });
            }
          });
        }
        setImages(existingImages);

        // Load existing attributes
        if (product.attributes && typeof product.attributes === 'object') {
          setProductAttributes(product.attributes as Record<string, string[]>);
        }
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setIsFetching(false);
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

  const handleAttributeToggle = (category: string, value: string) => {
    setProductAttributes((prev) => {
      const currentValues = prev[category] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      
      if (newValues.length === 0) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [category]: newValues };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          image: imageUrls[0] || null,
          images: imageUrls.slice(1),
          categoryId: formData.categoryId || null,
          featured: formData.featured,
          attributes: Object.keys(productAttributes).length > 0 ? productAttributes : null,
        }),
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        // Try to parse JSON, but handle cases where response might not be JSON
        let errorMessage = "Failed to update product";
        try {
          const data = await res.json();
          console.error("API Error:", data);
          errorMessage = data.details || data.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get text response
          try {
            const text = await res.text();
            console.error("API Error (text):", text);
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.error("Failed to parse error response:", textError);
            errorMessage = `Server error (${res.status}): ${res.statusText}`;
          }
        }
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error("Error updating product:", error);
      // Check if it's an image processing error or API error
      if (error?.message?.includes("image") || error?.message?.includes("FileReader")) {
        setError("An error occurred while processing images. Please try again.");
      } else {
        setError(error?.message || "An error occurred while updating the product. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (isFetching) {
    return <div className="container mx-auto px-4 py-8 text-center text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Product</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Ecommerce{" "}
          <span className="mx-2">&gt;</span> Edit product
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Product Details */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  className="flex min-h-[120px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Price <span className="text-red-500">*</span>
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  id="categoryId"
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Featured Product
                </label>
              </div>

              {/* Attributes Section */}
              <div>
                <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">
                  Product Attributes
                </label>
                {attributes.length > 0 ? (
                  <div className="space-y-4">
                    {attributes.map((attribute) => {
                      const selectedValues = productAttributes[attribute.category] || [];
                      return (
                        <div key={attribute.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 capitalize">
                            {attribute.category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {attribute.values.map((value) => {
                              const isSelected = selectedValues.includes(value);
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => handleAttributeToggle(attribute.category, value)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600"
                                  }`}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                          {selectedValues.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Selected: {selectedValues.join(", ")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No attributes available. Please add attributes in the Attributes section.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media */}
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
                      className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Drop your images here or select click to browse
                      </p>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Images and videos are optional. Pay attention to the quality of the media you add, comply with the background color standards. Media must be in certain dimensions. Notice that the product shows all the details. The first image/video will be displayed initially, and on hover it will fade to the next media item.
                </p>
                {images.length > 0 && (
                  <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {images.length} media file{images.length !== 1 ? 's' : ''} uploaded
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
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

