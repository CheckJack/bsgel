"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Attribute {
  id: string;
  category: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  valueCount?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortField = "category" | "valueCount" | "usageCount" | "createdAt";
type SortDirection = "asc" | "desc";

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>("category");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchAttributes();
  }, [currentPage, entriesPerPage, debouncedSearchQuery, sortField, sortDirection]);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: entriesPerPage.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
      });
      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      const res = await fetch(`/api/attributes?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        const attributesArray = Array.isArray(data.attributes) 
          ? data.attributes 
          : [];
        
        setAttributes(attributesArray);
        setPagination(data.pagination || pagination);
      } else {
        console.error("Failed to fetch attributes:", data.error || "Unknown error");
        toast("Failed to fetch attributes", "error");
        setAttributes([]);
      }
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
      toast("Failed to fetch attributes", "error");
      setAttributes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, category: string) => {
    if (!confirm(`Are you sure you want to delete the attribute "${category}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/attributes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast(`Attribute "${category}" deleted successfully`, "success");
        fetchAttributes();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete attribute", "error");
      }
    } catch (error) {
      console.error("Failed to delete attribute:", error);
      toast("Failed to delete attribute. Please try again.", "error");
    }
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading && attributes.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Attributes</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Attributes{" "}
          <span className="mx-2">&gt;</span> All attributes
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Left side: Entries Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Showing</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
            </div>

            {/* Right side: Search and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-2xl">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by category or value..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Add New Button */}
              <Link href="/admin/attributes/new" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border border-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add new
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attributes Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center">
                      Category
                      {getSortIcon("category")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Values
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("valueCount")}
                  >
                    <div className="flex items-center">
                      Value Count
                      {getSortIcon("valueCount")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("usageCount")}
                  >
                    <div className="flex items-center">
                      Usage
                      {getSortIcon("usageCount")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Created
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {!Array.isArray(attributes) || attributes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-gray-400 dark:text-gray-500 text-4xl">📦</div>
                        <div className="text-gray-500 dark:text-gray-400 font-medium">
                          {searchQuery ? "No attributes found matching your search" : "No attributes found"}
                        </div>
                        {!searchQuery && (
                          <Link href="/admin/attributes/new">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                              <Plus className="h-4 w-4 mr-2" />
                              Create your first attribute
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  attributes.map((attribute) => {
                    const displayValues = attribute.values.slice(0, 3);
                    const remainingCount = attribute.values.length - 3;
                    return (
                      <tr
                        key={attribute.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Category Column */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {attribute.category}
                          </span>
                        </td>

                        {/* Values Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {displayValues.map((value, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                              >
                                {value}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                +{remainingCount} more
                              </span>
                            )}
                            {attribute.values.length === 0 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">No values</span>
                            )}
                          </div>
                        </td>

                        {/* Value Count Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {attribute.valueCount || attribute.values.length}
                          </span>
                        </td>

                        {/* Usage Count Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {attribute.usageCount || 0}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {attribute.usageCount === 1 ? "product" : "products"}
                          </span>
                        </td>

                        {/* Created Date Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(attribute.createdAt)}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/attributes/${attribute.id}`}>
                              <button
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(attribute.id, attribute.category)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
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
          {pagination.totalPages > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, pagination.total)} of {pagination.total} entries
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
    </div>
  );
}

