"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/language-context";
import { Search, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Download, Copy, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  quantity: number;
  sale: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortField = "name" | "quantity" | "sale" | "createdAt";
type SortDirection = "asc" | "desc";

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [bulkEditData, setBulkEditData] = useState({
    name: "",
    description: "",
    icon: "",
  });

  useEffect(() => {
    fetchCategories();
  }, [currentPage, entriesPerPage, searchQuery, sortField, sortDirection]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: entriesPerPage.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
      });
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`/api/categories?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        const categoriesArray = Array.isArray(data.categories) 
          ? data.categories 
          : Array.isArray(data) 
          ? data 
          : [];
        
        setCategories(categoriesArray);
        setPagination(data.pagination || pagination);
      } else {
        console.error("Failed to fetch categories:", data.error || "Unknown error");
        toast("Failed to fetch categories", "error");
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast("Failed to fetch categories", "error");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
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

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1 text-blue-600" />
      : <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />;
  };

  // Handle delete category
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("categories.deleteConfirmWithName", { name }))) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast(t("categories.deleteSuccessWithName", { name }), "success");
        fetchCategories();
        setSelectedCategories((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        const data = await res.json();
        toast(data.error || t("categories.deleteError"), "error");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast(t("categories.deleteError"), "error");
    }
  };

  // Handle duplicate category
  const handleDuplicate = async (id: string) => {
    setIsDuplicating(id);
    try {
      const res = await fetch(`/api/categories/${id}/duplicate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        toast(`Category duplicated successfully: ${data.name}`, "success");
        fetchCategories();
      } else {
        const error = await res.json();
        toast(error.error || t("categories.duplicateError"), "error");
      }
    } catch (error) {
      console.error("Failed to duplicate category:", error);
      toast(t("categories.duplicateError"), "error");
    } finally {
      setIsDuplicating(null);
    }
  };

  // Handle select category
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map((c) => c.id)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      toast(t("categories.selectAtLeastOne"), "warning");
      return;
    }

    const confirmMessage = t("categories.bulkDeleteConfirm", { count: selectedCategories.size });
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/categories/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryIds: Array.from(selectedCategories),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(t("categories.bulkDeleteSuccessWithCount", { count: data.count }), "success");
        setSelectedCategories(new Set());
        fetchCategories();
      } else {
        const error = await res.json();
        toast(error.error || t("categories.bulkDeleteError"), "error");
      }
    } catch (error) {
      console.error("Failed to bulk delete categories:", error);
      toast("Failed to delete categories", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handle bulk edit
  const handleBulkEdit = async () => {
    if (selectedCategories.size === 0) {
      toast(t("categories.selectAtLeastOne"), "warning");
      return;
    }

    const updates: any = {};

    if (bulkEditData.name !== "") {
      updates.name = bulkEditData.name;
    }

    if (bulkEditData.description !== "") {
      updates.description = bulkEditData.description;
    }

    if (bulkEditData.icon !== "") {
      updates.icon = bulkEditData.icon;
    }

    if (Object.keys(updates).length === 0) {
      toast(t("categories.selectAtLeastOneField"), "warning");
      return;
    }

    setIsBulkEditing(true);
    try {
      const res = await fetch("/api/categories/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryIds: Array.from(selectedCategories),
          updates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(t("categories.bulkEditSuccessWithCount", { count: data.count }), "success");
        setShowBulkEditModal(false);
        setSelectedCategories(new Set());
        setBulkEditData({ name: "", description: "", icon: "" });
        fetchCategories();
      } else {
        const error = await res.json();
        toast(error.error || t("categories.bulkEditError"), "error");
      }
    } catch (error) {
      console.error("Failed to bulk edit categories:", error);
      toast(t("categories.bulkEditError"), "error");
    } finally {
      setIsBulkEditing(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all categories for export
      const res = await fetch("/api/categories?limit=10000");
      const data = await res.json();
      const allCategories = Array.isArray(data.categories) ? data.categories : [];

      // Create CSV content
      const headers = ["ID", "Name", "Slug", "Description", "Icon", "Products Count", "Total Sales", "Created At"];
      const rows = allCategories.map((category: Category) => [
        category.id,
        `"${category.name.replace(/"/g, '""')}"`,
        category.slug,
        `"${(category.description || "").replace(/"/g, '""')}"`,
        category.icon || "",
        category.quantity.toString(),
        category.sale.toString(),
        new Date(category.createdAt).toLocaleDateString(),
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
      link.setAttribute("download", `categories_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast(t("categories.exportSuccessWithCount", { count: allCategories.length }), "success");
    } catch (error) {
      console.error("Failed to export categories:", error);
      toast("Failed to export categories", "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("categories.title")}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t("sidebar.dashboard")} <span className="mx-2">&gt;</span> {t("sidebar.categories")}{" "}
          <span className="mx-2">&gt;</span> {t("categories.title")}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCategories.size > 0 && (
        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{selectedCategories.size}</span> {t("categories.selected")}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBulkEditModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isBulkDeleting}
                >
                  {t("categories.bulkEdit")}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? t("common.loading") : t("categories.bulkDelete")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCategories(new Set())}
                  disabled={isBulkDeleting}
                >
                  {t("products.clearSelection")}
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
            {/* Left side: Entries Dropdown */}
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
                <option value={10}>10 entries</option>
                <option value={25}>25 entries</option>
                <option value={50}>50 entries</option>
                <option value={100}>100 entries</option>
              </select>
            </div>

            {/* Right side: Search, Export and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-2xl">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder={t("common.search")}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isExporting || categories.length === 0}
                variant="outline"
                className="flex-shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? t("common.loading") : t("table.export")}
              </Button>

              {/* Add New Button */}
              <Link href="/admin/categories/new" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("categories.newCategory")}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        categories.length > 0 &&
                        categories.every((c) => selectedCategories.has(c.id))
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      {t("categories.categoryName")}
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("categories.icon")}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center">
                      {t("categories.quantity")}
                      {getSortIcon("quantity")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("sale")}
                  >
                    <div className="flex items-center">
                      {t("categories.sale")}
                      {getSortIcon("sale")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      {t("categories.createdAt")}
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {!Array.isArray(categories) || categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t("categories.noCategories")}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedCategories.has(category.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(category.id)}
                          onChange={() => handleSelectCategory(category.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>

                      {/* Category Column with Image and Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                                {t("common.noImage")}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                {category.name}
                              </p>
                              {category.parentId && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  Subcategory
                                  {category.parent && (
                                    <span className="ml-1 text-purple-600 dark:text-purple-300">
                                      of {category.parent.name}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Icon Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl">
                          {category.icon || "📦"}
                        </span>
                      </td>

                      {/* Quantity Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {category.quantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Total Sales Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {category.sale.toLocaleString()}
                        </span>
                      </td>

                      {/* Start Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(category.createdAt)}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/categories/${category.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              {t("common.edit")}
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleDuplicate(category.id)}
                            disabled={isDuplicating === category.id}
                            title={t("categories.duplicateCategory")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleDelete(category.id, category.name)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {entriesPerPage} entries
                </div>
                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.totalPages ||
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
                      setCurrentPage((prev) =>
                        Math.min(pagination.totalPages, prev + 1)
                      )
                    }
                    disabled={currentPage === pagination.totalPages}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Bulk Edit Categories
                </h2>
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditData({ name: "", description: "", icon: "" });
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Update {selectedCategories.size} selected category/categories. Leave fields empty to skip updating them.
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={bulkEditData.name}
                    onChange={(e) =>
                      setBulkEditData({ ...bulkEditData, name: e.target.value })
                    }
                    placeholder={t("categories.leaveEmptyToSkip")}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={bulkEditData.description}
                    onChange={(e) =>
                      setBulkEditData({ ...bulkEditData, description: e.target.value })
                    }
                    placeholder={t("categories.leaveEmptyToSkip")}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon (emoji)
                  </label>
                  <Input
                    type="text"
                    value={bulkEditData.icon}
                    onChange={(e) =>
                      setBulkEditData({ ...bulkEditData, icon: e.target.value })
                    }
                    placeholder={t("categories.leaveEmptyToSkip")}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleBulkEdit}
                  disabled={isBulkEditing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isBulkEditing ? "Updating..." : "Update Categories"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditData({ name: "", description: "", icon: "" });
                  }}
                  disabled={isBulkEditing}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
