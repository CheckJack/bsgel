"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Search, Lightbulb, ChevronLeft, ChevronRight, X, Download, Copy, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface Product {
  id: string;
  name: string;
  price: string;
  salePrice?: string | null;
  discountPercentage?: number | null;
  featured: boolean;
  image: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [bulkEditData, setBulkEditData] = useState({
    categoryId: "",
    subcategoryIds: [] as string[],
    featured: "",
    price: "",
    discountPercentage: "",
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

  // Format category/subcategory names: replace dots, hyphens, underscores with spaces and format properly
  const formatName = (name: string) => {
    if (!name) return name;
    // Replace dots, hyphens, and underscores with spaces, then clean up and capitalize
    return name
      .replace(/\./g, ' ')        // Replace dots with spaces
      .replace(/_/g, ' ')         // Replace underscores with spaces  
      .replace(/-/g, ' ')         // Replace hyphens with spaces
      .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
      .trim()                     // Remove leading/trailing spaces
      .split(' ')                 // Split into words
      .map(word => {
        if (!word) return '';
        // Capitalize first letter, lowercase the rest
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .filter(word => word.length > 0) // Remove empty words
      .join(' ');                 // Join back with spaces
  };
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize state from URL params on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlPage = searchParams.get("page");
    const urlEntries = searchParams.get("entries");
    
    setSearchQuery(urlSearch);
    setCategoryFilter(urlCategory);
    if (urlPage) {
      const pageNum = parseInt(urlPage, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
    if (urlEntries) {
      const entriesNum = parseInt(urlEntries, 10);
      if (!isNaN(entriesNum) && [10, 25, 50, 100].includes(entriesNum)) {
        setEntriesPerPage(entriesNum);
      }
    }
    setIsRestoringState(false);
  }, []); // Only run on mount

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter subcategories (categories with parentId that is not null)
    const subs = categories.filter((cat) => cat.parentId !== null && cat.parentId !== undefined && cat.parentId !== "");
    setSubcategories(subs);
    // Debug: log to see what we're getting
    if (subs.length === 0 && categories.length > 0) {
      console.log("No subcategories found. Categories:", categories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })));
    }
  }, [categories]);

  // Sync search query with URL params from AdminHeader (but not on initial mount)
  useEffect(() => {
    if (!isRestoringState) {
      const urlSearchQuery = searchParams.get("search") || "";
      setSearchQuery(urlSearchQuery);
    }
  }, [searchParams, isRestoringState]);

  const fetchCategories = async () => {
    try {
      // Fetch all categories - use a high limit to get all at once
      const res = await fetch("/api/categories?limit=10000");
      if (res.ok) {
        const data = await res.json();
        const categoriesList = data.categories || data || [];
        
        // Ensure parentId is included in the type
        const typedCategories: Category[] = categoriesList.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId || null,
        }));
        
        setCategories(typedCategories);
        
        // Debug: check if parentId is being returned
        const withParentId = typedCategories.filter((cat) => cat.parentId);
        console.log(`Fetched ${typedCategories.length} categories, ${withParentId.length} have parentId`);
        if (withParentId.length > 0) {
          console.log("Subcategories found:", withParentId.map(c => c.name));
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Update URL params when filters/pagination change
  useEffect(() => {
    if (isRestoringState) return; // Don't update URL during initial state restoration
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery);
    }
    if (categoryFilter) {
      params.set("category", categoryFilter);
    }
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }
    if (entriesPerPage !== 10) {
      params.set("entries", entriesPerPage.toString());
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, categoryFilter, currentPage, entriesPerPage, isRestoringState, pathname, router]);

  useEffect(() => {
    // Filter products based on search query and category
    let filtered = products;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (product) => product.category?.id === categoryFilter
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, products]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast("Failed to fetch products", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("products.deleteConfirm"))) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast(t("products.deleteSuccess"), "success");
        fetchProducts();
        // Remove from selection if selected
        setSelectedProducts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        const error = await res.json();
        toast(error.error || t("products.deleteError"), "error");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast(t("products.deleteError"), "error");
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsDuplicating(id);
    try {
      const res = await fetch(`/api/products/${id}/duplicate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        toast(t("products.duplicateSuccess"), "success");
        fetchProducts();
      } else {
        const error = await res.json();
        toast(error.error || t("products.duplicateError"), "error");
      }
    } catch (error) {
      console.error("Failed to duplicate product:", error);
      toast(t("products.duplicateError"), "error");
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      // Deselect all on current page
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        paginatedProducts.forEach((product) => newSet.delete(product.id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        paginatedProducts.forEach((product) => newSet.add(product.id));
        return newSet;
      });
    }
  };

  const handleBulkEdit = async () => {
    if (selectedProducts.size === 0) {
      toast("Please select at least one product", "warning");
      return;
    }

    const updates: any = {};

    if (bulkEditData.categoryId !== "") {
      updates.categoryId = bulkEditData.categoryId === "none" ? null : bulkEditData.categoryId;
    }

    // Subcategories: send if explicitly set (including empty array to clear)
    // We'll always include it since the user can select/deselect subcategories
    updates.subcategoryIds = bulkEditData.subcategoryIds || [];

    if (bulkEditData.featured !== "") {
      updates.featured = bulkEditData.featured === "true";
    }

    if (bulkEditData.price !== "") {
      const price = parseFloat(bulkEditData.price);
      if (isNaN(price) || price < 0) {
        toast(t("products.invalidPrice"), "error");
        return;
      }
      updates.price = price;
    }

    if (bulkEditData.discountPercentage !== "") {
      const discount = parseInt(bulkEditData.discountPercentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        toast(t("products.invalidDiscount"), "error");
        return;
      }
      updates.discountPercentage = discount;
    }

    // Showcasing sections: send if explicitly set (including empty array to clear)
    if (bulkEditData.showcasingSections !== undefined) {
      updates.showcasingSections = bulkEditData.showcasingSections;
    }

    if (Object.keys(updates).length === 0) {
      toast(t("products.selectAtLeastOneField"), "warning");
      return;
    }

    setIsBulkEditing(true);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
          updates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(t("products.bulkEditSuccessWithCount", { count: data.count }), "success");
        setShowBulkEditModal(false);
        setSelectedProducts(new Set());
        setBulkEditData({ categoryId: "", subcategoryIds: [], featured: "", price: "", discountPercentage: "", showcasingSections: [] });
        fetchProducts();
      } else {
        const error = await res.json();
        toast(error.error || t("products.bulkEditError"), "error");
      }
    } catch (error) {
      console.error("Failed to bulk edit products:", error);
      toast(t("products.bulkEditError"), "error");
    } finally {
      setIsBulkEditing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast(t("products.selectAtLeastOne"), "warning");
      return;
    }

    const confirmMessage = t("products.bulkDeleteConfirm", { count: selectedProducts.size });
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/products/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(t("products.bulkDeleteSuccessWithCount", { count: data.count }), "success");
        setSelectedProducts(new Set());
        fetchProducts();
      } else {
        const error = await res.json();
        toast(error.error || t("products.bulkDeleteError"), "error");
      }
    } catch (error) {
      console.error("Failed to bulk delete products:", error);
      toast(t("products.bulkDeleteError"), "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = ["ID", "Name", "Price", "Sale Price", "Discount %", "Category", "Featured", "Created At"];
      const rows = filteredProducts.map((product) => [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`,
        product.price,
        product.salePrice || "",
        product.discountPercentage?.toString() || "",
        product.category?.name || "",
        product.featured ? "Yes" : "No",
        new Date(product.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `products_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast(t("products.exportSuccessWithCount", { count: filteredProducts.length }), "success");
    } catch (error) {
      console.error("Failed to export products:", error);
      toast("Failed to export products", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Generate short product ID (first 7 characters)
  const getShortProductId = (id: string) => {
    return `#${id.substring(0, 7)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate sale percentage
  const getSalePercentage = (product: Product): number | null => {
    if (product.discountPercentage !== null && product.discountPercentage !== undefined) {
      return product.discountPercentage;
    }
    if (product.salePrice) {
      const price = parseFloat(product.price);
      const salePrice = parseFloat(product.salePrice);
      if (price > 0 && salePrice < price) {
        return Math.round(((price - salePrice) / price) * 100);
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{t("products.title")}</h1>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {t("sidebar.dashboard")} <span className="mx-2">&gt;</span> {t("sidebar.ecommerce")}{" "}
          <span className="mx-2">&gt;</span> {t("products.title")}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{selectedProducts.size}</span> {t("products.title").toLowerCase()}(s) {t("table.selected", { count: selectedProducts.size })}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBulkEditModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isBulkDeleting}
                >
                  {t("products.bulkEdit")}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? t("common.loading") : t("products.bulkDelete")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProducts(new Set())}
                  disabled={isBulkDeleting}
                >
                  {t("products.deselectAll")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Left side: Tip and Entries */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Tip Message */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span>{t("products.tipSearch")}</span>
              </div>

              {/* Entries Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">{t("table.showing")}</label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 {t("table.entriesPerPage")}</option>
                  <option value={25}>25 {t("table.entriesPerPage")}</option>
                  <option value={50}>50 {t("table.entriesPerPage")}</option>
                  <option value={100}>100 {t("table.entriesPerPage")}</option>
                </select>
              </div>
            </div>

            {/* Right side: Search, Filter, Export and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-4xl">
              {/* Category Filter */}
              <div className="flex-1 sm:flex-initial sm:min-w-[180px]">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t("products.allCategories")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {formatName(category.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder={t("common.search")}
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      setCurrentPage(1); // Reset to first page when search changes
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isExporting || filteredProducts.length === 0}
                variant="outline"
                className="flex-shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? t("common.loading") : t("products.export")}
              </Button>

              {/* Add New Button */}
              <Link href="/admin/products/new" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  + {t("products.addProduct")}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProducts.length > 0 &&
                        paginatedProducts.every((p) => selectedProducts.has(p.id))
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("products.product")}
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("products.productId")}
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("products.price")}
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("products.startDate")}
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t("products.noProducts")}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    return (
                      <tr
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          selectedProducts.has(product.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        {/* Checkbox Column */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectProduct(product.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                        </td>
                        {/* Product Column */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="(max-width: 640px) 40px, 56px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                {product.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Product ID */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                            {getShortProductId(product.id)}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            {product.salePrice ? (
                              <>
                                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                                  {formatPrice(product.price)}
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {formatPrice(product.salePrice)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Start Date */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(product.createdAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Link href={`/admin/products/${product.id}?${new URLSearchParams({
                              ...(searchQuery && { search: searchQuery }),
                              ...(categoryFilter && { category: categoryFilter }),
                              ...(currentPage > 1 && { page: currentPage.toString() }),
                              ...(entriesPerPage !== 10 && { entries: entriesPerPage.toString() }),
                            }).toString()}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDuplicate(product.id)}
                              disabled={isDuplicating === product.id}
                              title={t("products.duplicateProduct")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDelete(product.id)}
                            >
                              {t("common.delete")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("table.showing")} {startIndex + 1} {t("table.to")} {Math.min(endIndex, filteredProducts.length)} {t("table.of")} {filteredProducts.length} {t("table.entriesPerPage")}
                </div>
                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                        {idx < arr.length - 1 &&
                          arr[idx + 1] !== page + 1 && (
                            <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
                          )}
                      </div>
                    ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-6xl bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("products.bulkEditProducts")}
                </h2>
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditData({ categoryId: "", subcategoryIds: [], featured: "", price: "", discountPercentage: "", showcasingSections: [] });
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t("products.updateSelectedProducts", { count: selectedProducts.size })}
              </p>

              <div className="flex gap-6">
                {/* Left Container */}
                <div className="flex-1 space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.category")}
                    </label>
                    <select
                      value={bulkEditData.categoryId}
                      onChange={(e) =>
                        setBulkEditData({ ...bulkEditData, categoryId: e.target.value })
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t("products.noChange")}</option>
                      <option value="none">{t("products.removeCategory")}</option>
                      {categories.filter((cat) => !cat.parentId).map((category) => (
                        <option key={category.id} value={category.id}>
                          {formatName(category.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategories Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.subcategories") || "Subcategories"}
                    </label>
                    {subcategories.length > 0 ? (
                      <>
                        <select
                          multiple
                          value={bulkEditData.subcategoryIds}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                            setBulkEditData({ ...bulkEditData, subcategoryIds: selected });
                          }}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                          size={5}
                        >
                          {subcategories.map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {formatName(subcategory.name)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t("products.holdCtrlToSelectMultiple") || "Hold Ctrl/Cmd to select multiple"}
                        </p>
                      </>
                    ) : (
                      <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 min-h-[100px] flex items-center justify-center">
                        <p className="text-center">No subcategories available. Create subcategories in the Categories section first.</p>
                      </div>
                    )}
                  </div>

                  {/* Featured Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.featuredStatus")}
                    </label>
                    <select
                      value={bulkEditData.featured}
                      onChange={(e) =>
                        setBulkEditData({ ...bulkEditData, featured: e.target.value })
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t("products.noChange")}</option>
                      <option value="true">{t("products.featured")}</option>
                      <option value="false">{t("products.notFeatured")}</option>
                    </select>
                  </div>
                </div>

                {/* Right Container */}
                <div className="flex-1 space-y-4">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.price")}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bulkEditData.price}
                      onChange={(e) =>
                        setBulkEditData({ ...bulkEditData, price: e.target.value })
                      }
                      placeholder={t("products.leaveEmptyToSkip")}
                      className="w-full"
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.discountPercentage")}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={bulkEditData.discountPercentage}
                      onChange={(e) =>
                        setBulkEditData({ ...bulkEditData, discountPercentage: e.target.value })
                      }
                      placeholder={t("products.leaveEmptyToSkip")}
                      className="w-full"
                    />
                  </div>

                  {/* Showcasing Sections */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Showcasing Sections
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Select showcasing sections for these products
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                      {showcasingSections.map((section) => (
                        <label
                          key={section.value}
                          className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={bulkEditData.showcasingSections.includes(section.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkEditData({
                                  ...bulkEditData,
                                  showcasingSections: [...bulkEditData.showcasingSections, section.value],
                                });
                              } else {
                                setBulkEditData({
                                  ...bulkEditData,
                                  showcasingSections: bulkEditData.showcasingSections.filter((id) => id !== section.value),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{section.label}</span>
                        </label>
                      ))}
                    </div>
                    {bulkEditData.showcasingSections.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {bulkEditData.showcasingSections.length} section{bulkEditData.showcasingSections.length === 1 ? "" : "s"} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleBulkEdit}
                  disabled={isBulkEditing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isBulkEditing ? t("common.loading") : t("products.updateProducts")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditData({ categoryId: "", subcategoryIds: [], featured: "", price: "", discountPercentage: "", showcasingSections: [] });
                  }}
                  disabled={isBulkEditing}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
