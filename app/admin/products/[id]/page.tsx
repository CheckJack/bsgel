"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ADMIN_SHOWCASING_SECTIONS } from "@/lib/brand-lines";
import { X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import {
  healAdminMediaUrls,
  uploadProductMediaFile,
} from "@/lib/products/admin-media-client";

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

interface Attribute {
  id: string;
  category: string;
  values: string[];
}

interface AttributeValue {
  value: string;
  price?: number | null;
  images?: string[];
}

interface AttributeImagePreview {
  url: string;
  file?: File;
}

function EditProductPageContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: "",
    subcategoryIds: [] as string[],
    featured: false,
    stockQuantity: "0",
    hemaFree: false,
    showcasingSections: [] as string[],
    hasDiscount: false,
    discountPrice: "",
  });

  const showcasingSections = [...ADMIN_SHOWCASING_SECTIONS];
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [productAttributes, setProductAttributes] = useState<Record<string, AttributeValue[]>>({});
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
      // Fetch all categories (no pagination limit)
      const res = await fetch("/api/categories?limit=1000");
      if (res.ok) {
        const data = await res.json();
        // API returns { categories: [], pagination: {} }
        // The API already returns all categories (both main and subcategories) in a flat list
        // We just need to use them directly
        const allCategories = data.categories || data || [];
        console.log("Fetched categories:", allCategories);
        console.log("Categories with parentId:", allCategories.filter((cat: Category) => cat.parentId));
        setCategories(allCategories);
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
    setIsFetching(true);
    setError("");
    try {
      const productId = typeof params.id === 'string' ? params.id : params.id?.[0];
      if (!productId) {
        setError("Product ID is missing");
        setIsFetching(false);
        return;
      }

      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      
      if (!res.ok) {
        // Handle error response
        const errorMessage = data.error || `Failed to load product (${res.status})`;
        setError(errorMessage);
        console.error("Failed to fetch product:", errorMessage, data);
        setIsFetching(false);
        return;
      }

      const product = data;
      console.log("Fetched product data:", product);
      
      // Extract subcategory IDs from the product
      const subcategoryIds = (product as any).subcategories 
        ? (product as any).subcategories.map((sub: any) => sub.categoryId || sub.category?.id).filter(Boolean)
        : [];
      
      // Handle price conversion - Prisma Decimal can be a string or number
      let priceString = "";
      if (product.price !== undefined && product.price !== null) {
        if (typeof product.price === 'object' && product.price.toString) {
          // Prisma Decimal type
          priceString = product.price.toString();
        } else {
          priceString = String(product.price);
        }
      }
      
      // Handle salePrice (discount price) conversion
      let discountPriceString = "";
      // Check if salePrice exists and is not null/empty
      const salePriceValue = product.salePrice;
      const hasDiscount = salePriceValue !== undefined && salePriceValue !== null && salePriceValue !== "" && salePriceValue !== "null";
      if (hasDiscount) {
        if (typeof salePriceValue === 'object' && salePriceValue.toString) {
          discountPriceString = salePriceValue.toString();
        } else {
          discountPriceString = String(salePriceValue);
        }
      }
      console.log("Loading product - salePrice:", salePriceValue, "hasDiscount:", hasDiscount, "discountPriceString:", discountPriceString);
      
      setFormData({
        id: product.id || "",
        name: product.name || "",
        description: product.description || "",
        price: priceString,
        image: product.image || "",
        categoryId: product.categoryId || "",
        subcategoryIds: subcategoryIds,
        featured: product.featured || false,
        stockQuantity: String((product as any).stockQuantity ?? ((product as any).outOfStock ? 0 : 999)),
        hemaFree: (product as any).hemaFree || false,
        showcasingSections: (product as any).showcasingSections || [],
        hasDiscount: hasDiscount,
        discountPrice: discountPriceString,
      });
      
      // Load existing images; prefer local /uploads over dead WordPress URLs
      const existingImages: ImagePreview[] = [];
      const isVideo = (url: string) =>
        /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.startsWith("data:video/");
      const rawUrls: string[] = [];
      if (product.image) rawUrls.push(product.image);
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img: string) => {
          if (img) rawUrls.push(img);
        });
      }
      healAdminMediaUrls(rawUrls).forEach((url) => {
        existingImages.push({ url, type: isVideo(url) ? "video" : "image" });
      });
      setImages(existingImages);

      // Load existing attributes - handle both old format (string[]) and new format (AttributeValue[])
      if (product.attributes && typeof product.attributes === 'object') {
        const attrs = product.attributes as Record<string, any>;
        const convertedAttrs: Record<string, AttributeValue[]> = {};
        
        Object.entries(attrs).forEach(([category, values]) => {
          if (Array.isArray(values)) {
            // Check if it's old format (string[]) or new format (AttributeValue[])
            if (values.length > 0 && typeof values[0] === 'string') {
              // Old format: convert to new format
              convertedAttrs[category] = values.map((v: string) => ({
                value: v,
                price: null,
                images: [],
              }));
            } else {
              // New format: use as is
              convertedAttrs[category] = values.map((v: any) => ({
                value: v.value || v,
                price: v.price !== undefined ? v.price : null,
                images: v.images || [],
              }));
            }
          }
        });
        
        setProductAttributes(convertedAttrs);
      }
    } catch (error: any) {
      console.error("Failed to fetch product:", error);
      setError(error?.message || "Failed to load product. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const productId =
      formData.id.trim() ||
      (typeof params.id === "string" ? params.id : params.id?.[0] || "");
    if (!productId) {
      setError("Product ID is required before uploading images.");
      return;
    }

    setError("");
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          continue;
        }
        if (!file.size) {
          throw new Error(
            "One of the files is empty. Download it to this device first (not cloud-only), then try again."
          );
        }
        const type = file.type.startsWith("video/") ? "video" : "image";
        const url = await uploadProductMediaFile(
          productId,
          file,
          `gallery-${Date.now()}-${i}`
        );
        setImages((prev) => [...prev, { url, type }]);
      }
    } catch (error: any) {
      console.error("Failed to upload product media:", error);
      setError(error?.message || "Failed to upload images. Please try again.");
    }
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      const removed = updated[index];
      if (removed?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleImageMove = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.splice(next, 0, item);
      return updated;
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const productId =
      formData.id.trim() ||
      (typeof params.id === "string" ? params.id : params.id?.[0] || "");
    if (!productId) {
      setError("Product ID is required before uploading images.");
      return;
    }

    setError("");
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          continue;
        }
        if (!file.size) {
          throw new Error(
            "One of the files is empty. Download it to this device first (not cloud-only), then try again."
          );
        }
        const type = file.type.startsWith("video/") ? "video" : "image";
        const url = await uploadProductMediaFile(
          productId,
          file,
          `gallery-${Date.now()}-${i}`
        );
        setImages((prev) => [...prev, { url, type }]);
      }
    } catch (error: any) {
      console.error("Failed to upload product media:", error);
      setError(error?.message || "Failed to upload images. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAttributeToggle = (category: string, value: string) => {
    setProductAttributes((prev) => {
      const currentValues = prev[category] || [];
      const existingIndex = currentValues.findIndex((v) => v.value === value);
      
      let newValues: AttributeValue[];
      if (existingIndex >= 0) {
        // Remove attribute value
        newValues = currentValues.filter((v) => v.value !== value);
      } else {
        // Add attribute value with default structure
        newValues = [...currentValues, { value, price: null, images: [] }];
      }
      
      if (newValues.length === 0) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [category]: newValues };
    });
  };

  const handleAttributePriceChange = (category: string, value: string, price: string) => {
    setProductAttributes((prev) => {
      const currentValues = prev[category] || [];
      const updatedValues = currentValues.map((attr) =>
        attr.value === value
          ? { ...attr, price: price === '' ? null : parseFloat(price) || null }
          : attr
      );
      return { ...prev, [category]: updatedValues };
    });
  };

  const handleAttributeImageUpload = async (
    category: string,
    value: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    const productId =
      formData.id.trim() ||
      (typeof params.id === "string" ? params.id : params.id?.[0] || "");
    if (!productId) {
      setError("Product ID is required before uploading images.");
      return;
    }

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadProductMediaFile(
          productId,
          file,
          `attr-${category}-${i}`
        );
        uploaded.push(url);
      }
      if (uploaded.length === 0) return;

      setProductAttributes((prev) => {
        const currentValues = prev[category] || [];
        const updatedValues = currentValues.map((attr) =>
          attr.value === value
            ? { ...attr, images: [...(attr.images || []), ...uploaded] }
            : attr
        );
        return { ...prev, [category]: updatedValues };
      });
    } catch (error: any) {
      console.error("Failed to upload attribute images:", error);
      setError(error?.message || "Failed to upload images. Please try again.");
    }
  };

  const handleAttributeImageRemove = (category: string, value: string, imageIndex: number) => {
    setProductAttributes((prev) => {
      const currentValues = prev[category] || [];
      const updatedValues = currentValues.map((attr) =>
        attr.value === value
          ? {
              ...attr,
              images: (attr.images || []).filter((_, idx) => idx !== imageIndex),
            }
          : attr
      );
      return { ...prev, [category]: updatedValues };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const currentProductId = typeof params.id === "string" ? params.id : params.id[0];
      const productId = formData.id.trim();

      // Ensure ID is present
      if (!productId) {
        setError("Product ID is required. Please enter a valid ID.");
        setIsLoading(false);
        return;
      }

      // Media should already be uploaded to /uploads on select.
      // Only send stable public URLs — never blob: previews.
      const resolvedUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          // Legacy leftover: upload any file still pending
          const url = await uploadProductMediaFile(
            currentProductId,
            img.file,
            `gallery-${resolvedUrls.length}`
          );
          resolvedUrls.push(url);
        } else if (img.url && !img.url.startsWith("blob:")) {
          resolvedUrls.push(img.url);
        } else if (img.url?.startsWith("blob:")) {
          throw new Error(
            "A media preview is still uploading or failed. Remove it and add the image again."
          );
        }
      }
      const imageUrls = healAdminMediaUrls(resolvedUrls);
      setImages(
        imageUrls.map((url) => ({
          url,
          type: /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ? "video" : "image",
        }))
      );

      // Calculate base price from first size attribute if available
      let basePrice = 0;
      if (productAttributes && Object.keys(productAttributes).length > 0) {
        const sizeAttr = productAttributes["size"] || productAttributes["Size"];
        if (
          sizeAttr &&
          sizeAttr.length > 0 &&
          sizeAttr[0].price !== null &&
          sizeAttr[0].price !== undefined
        ) {
          basePrice = sizeAttr[0].price;
        }
      }

      // Calculate discount price if discount is enabled
      const salePrice =
        formData.hasDiscount &&
        formData.discountPrice &&
        formData.discountPrice.trim() !== ""
          ? parseFloat(formData.discountPrice)
          : null;

      console.log(
        "Submitting product - hasDiscount:",
        formData.hasDiscount,
        "discountPrice:",
        formData.discountPrice,
        "salePrice:",
        salePrice
      );

      const res = await fetch(`/api/products/${currentProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId, // Always send the ID from the form
          name: formData.name,
          description: formData.description || null,
          price: basePrice,
          salePrice: salePrice,
          image: imageUrls[0] || null,
          images: imageUrls.slice(1),
          categoryId: formData.categoryId || null,
          subcategoryIds: formData.subcategoryIds || [],
          featured: formData.featured,
          stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
          hemaFree: formData.hemaFree,
          attributes:
            Object.keys(productAttributes).length > 0 ? productAttributes : null,
          showcasingSections: formData.showcasingSections || [],
        }),
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("Product updated successfully:", responseData);
        
        // If ID changed, we need to update the URL
        const currentIdForRedirect = typeof params.id === 'string' ? params.id : params.id?.[0];
        if (responseData.id && currentIdForRedirect && responseData.id !== currentIdForRedirect) {
          // ID changed - redirect to new ID
          router.push(`/admin/products/${responseData.id}`);
          return;
        }
        
        // Reload the product to show updated discount
        await fetchProduct();
        
        // Show success message
        alert("Product updated successfully!");
        
        // Preserve query parameters (filters, pagination, etc.) when redirecting back
        const queryParams = new URLSearchParams();
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const page = searchParams.get("page");
        const entries = searchParams.get("entries");
        
        if (search) queryParams.set("search", search);
        if (category) queryParams.set("category", category);
        if (page) queryParams.set("page", page);
        if (entries) queryParams.set("entries", entries);
        
        const queryString = queryParams.toString();
        // Don't redirect immediately - let user see the updated form
        // router.push(queryString ? `/admin/products?${queryString}` : "/admin/products");
      } else {
        // Try to parse JSON, but handle cases where response might not be JSON
        let errorMessage = "Failed to update product";
        if (res.status === 413) {
          errorMessage =
            "Upload is too large for the server. Images are uploaded separately now — try again, or use a smaller file.";
        } else {
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Product ID"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  className="w-full font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Edit any part of the product ID as needed. Ensure the ID is unique. If changed, you'll be redirected to the new ID.
                </p>
              </div>

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
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description
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
              <label htmlFor="categoryId" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                id="categoryId"
                className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryIds: [] })}
              >
                <option value="">No Category</option>
                {categories.filter((cat) => !cat.parentId).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategories */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
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
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
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

        {/* Product Settings Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Product Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Product Tags - Independent checkboxes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Product Tags
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select tags for this product. Tags work independently and can be combined.
              </p>
              <div className="space-y-2">
                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock quantity
                  </label>
                  <input
                    type="number"
                    id="stockQuantity"
                    min={0}
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="h-10 w-32 rounded-md border border-gray-300 px-3 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500">Also editable on the Stock management page.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hemaFree"
                    checked={formData.hemaFree}
                    onChange={(e) => setFormData({ ...formData, hemaFree: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="hemaFree" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    HEMA Free
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Discount Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Pricing & Discount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discount Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasDiscount"
                checked={formData.hasDiscount}
                onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked, discountPrice: e.target.checked ? formData.discountPrice : "" })}
                className="h-4 w-4"
              />
              <label htmlFor="hasDiscount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Has Discount
              </label>
            </div>

            {/* Discount Price Field - Only show when discount is enabled */}
            {formData.hasDiscount && (
              <div>
                <label htmlFor="discountPrice" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Discount Price <span className="text-red-500">*</span>
                </label>
                <Input
                  id="discountPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  placeholder="0.00"
                  required={formData.hasDiscount}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The discounted price that will be displayed to customers. The original price will be shown as crossed out.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attributes Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Product Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            {attributes.length > 0 ? (
                  <div className="space-y-6">
                    {attributes.map((attribute) => {
                      const selectedValues = productAttributes[attribute.category] || [];
                      return (
                        <div key={attribute.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 capitalize">
                            {attribute.category}
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {attribute.values.map((value) => {
                              const isSelected = selectedValues.some((attr) => attr.value === value);
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
                          
                          {/* Selected Attributes with Price and Images */}
                          {selectedValues.length > 0 && (
                            <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                              {selectedValues.map((attrValue, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {attrValue.value}
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={() => handleAttributeToggle(attribute.category, attrValue.value)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  
                                  {/* Price Input */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Price {attribute.category.toLowerCase() === 'size' ? <span className="text-red-500">*</span> : '(optional)'}
                                    </label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={attrValue.price !== null && attrValue.price !== undefined ? attrValue.price : ''}
                                      onChange={(e) =>
                                        handleAttributePriceChange(attribute.category, attrValue.value, e.target.value)
                                      }
                                      placeholder="0.00"
                                      required={attribute.category.toLowerCase() === 'size'}
                                      className="w-full text-sm"
                                    />
                                  </div>
                                  
                                  {/* Images for this attribute value */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Images (at least one for sizes)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                      {attrValue.images && attrValue.images.length > 0 ? (
                                        attrValue.images.map((imgUrl, imgIdx) => (
                                          <div
                                            key={imgIdx}
                                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={imgUrl}
                                              alt={`${attrValue.value} image ${imgIdx + 1}`}
                                              className="absolute inset-0 h-full w-full object-cover"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleAttributeImageRemove(attribute.category, attrValue.value, imgIdx)
                                              }
                                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))
                                      ) : null}
                                      {(!attrValue.images || attrValue.images.length < 10) && (
                                        <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) =>
                                              handleAttributeImageUpload(attribute.category, attrValue.value, e.target.files)
                                            }
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          />
                                          <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                                          <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-1">
                                            Add Image
                                          </span>
                                        </label>
                                      )}
                                    </div>
                                    {attrValue.images && attrValue.images.length > 0 && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {attrValue.images.length} image{attrValue.images.length !== 1 ? 's' : ''} uploaded
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
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
          </CardContent>
        </Card>

        {/* Media Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Product Media</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              These images will appear for all product attributes. Attribute-specific images (set above) will appear first, followed by these backup images. Use the arrows to change order — position 1 is the main storefront image.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-4">
                  {images.map((image, index) => (
                      <div
                        key={`${image.url}-${index}`}
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
                          // Native img avoids Next optimizer breaking dead/remote admin previews
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.url}
                            alt={`Product image ${index + 1}`}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute top-2 left-2 z-10 min-w-6 h-6 px-1.5 bg-black/70 text-white text-xs font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                          {index === 0 ? " · main" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {images.length > 1 && (
                          <div className="absolute bottom-2 left-2 right-2 z-10 flex justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleImageMove(index, -1)}
                              disabled={index === 0}
                              className="w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              aria-label={`Move image ${index + 1} earlier`}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleImageMove(index, 1)}
                              disabled={index === images.length - 1}
                              className="w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              aria-label={`Move image ${index + 1} later`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {image.type === 'video' && (
                          <div className="absolute bottom-10 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Video
                          </div>
                        )}
                      </div>
                  ))}
                  {images.length < 12 && (
                      <div
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
                  )}
                </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Images and videos are optional. Pay attention to the quality of the media you add, comply with the background color standards. Media must be in certain dimensions. Notice that the product shows all the details. The first image/video will be displayed initially, and on hover it will fade to the next media item. Reorder with the arrows, then click Update Product to save.
            </p>
            {images.length > 0 && (
              <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {images.length} media file{images.length !== 1 ? 's' : ''} uploaded
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
      </form>
    </div>
  );
}

export default function EditProductPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EditProductPageContent />
    </Suspense>
  );
}

