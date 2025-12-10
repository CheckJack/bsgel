"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Filter,
  ChevronDown,
  Copy,
  Eye,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { toast, handleApiError, showLoadingToast } from "@/lib/utils";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  image: string | null;
  author: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type SortField = "title" | "publishedAt" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function AdminBlogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [selectedBlogs, setSelectedBlogs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>("publishedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Sync search query with URL params from AdminHeader
  useEffect(() => {
    const urlSearchQuery = searchParams.get("search") || "";
    setSearchQuery(urlSearchQuery);
  }, [searchParams]);

  useEffect(() => {
    // Filter and sort blogs
    let filtered = [...blogs];

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((blog) => blog.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "publishedAt":
          aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredBlogs(filtered);
    setCurrentPage(1); // Reset to first page on filter/sort change
  }, [searchQuery, statusFilter, blogs, sortBy, sortOrder]);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
        setFilteredBlogs(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      handleApiError(error, "load blog posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Blog post deleted successfully", "success");
        fetchBlogs();
        setSelectedBlogs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to delete blog:", error);
      handleApiError(error, "delete blog post");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsDuplicating(id);
    try {
      const res = await fetch(`/api/blogs/${id}/duplicate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        toast(`Blog duplicated successfully: ${data.title}`, "success");
        fetchBlogs();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to duplicate blog:", error);
      handleApiError(error, "duplicate blog post");
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleSelectBlog = (blogId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedBlogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blogId)) {
        newSet.delete(blogId);
      } else {
        newSet.add(blogId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageItems = paginatedBlogs.map((b) => b.id);
      setSelectedBlogs(new Set(currentPageItems));
    } else {
      setSelectedBlogs(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBlogs.size === 0) {
      toast("Please select at least one blog post", "warning");
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedBlogs.size} blog post(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsBulkDeleting(true);
    const loadingToastId = showLoadingToast(`Deleting ${selectedBlogs.size} blog post(s)...`);
    
    try {
      const res = await fetch("/api/blogs/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blogIds: Array.from(selectedBlogs),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(`Successfully deleted ${data.count} blog post(s)`, "success");
        setSelectedBlogs(new Set());
        fetchBlogs();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to bulk delete blogs:", error);
      handleApiError(error, "delete blog posts");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (status: "DRAFT" | "PUBLISHED") => {
    if (selectedBlogs.size === 0) {
      toast("Please select at least one blog post", "warning");
      return;
    }

    setIsBulkUpdating(true);
    const loadingToastId = showLoadingToast(`Updating ${selectedBlogs.size} blog post(s) to ${status}...`);
    
    try {
      const res = await fetch("/api/blogs/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blogIds: Array.from(selectedBlogs),
          status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(`Successfully updated ${data.count} blog post(s) to ${status}`, "success");
        setSelectedBlogs(new Set());
        fetchBlogs();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to bulk update blogs:", error);
      handleApiError(error, "update blog posts");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = [
        "ID",
        "Title",
        "Slug",
        "Excerpt",
        "Author",
        "Status",
        "Published Date",
        "Created Date",
        "Updated Date",
      ];
      const rows = filteredBlogs.map((blog) => [
        blog.id,
        `"${blog.title.replace(/"/g, '""')}"`,
        blog.slug,
        blog.excerpt ? `"${blog.excerpt.replace(/"/g, '""')}"` : "",
        blog.author || "",
        blog.status,
        blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "",
        new Date(blog.createdAt).toLocaleDateString(),
        new Date(blog.updatedAt).toLocaleDateString(),
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
      link.setAttribute(
        "download",
        `blogs_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast(`Exported ${filteredBlogs.length} blog posts to CSV`, "success");
    } catch (error) {
      console.error("Failed to export blogs:", error);
      handleApiError(error, "export blog posts");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleRowClick = (blogId: string) => {
    router.push(`/admin/blogs/${blogId}`);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredBlogs.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);
  const startRecord = filteredBlogs.length > 0 ? startIndex + 1 : 0;
  const endRecord = Math.min(endIndex, filteredBlogs.length);
  const totalRecords = filteredBlogs.length;

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Blog Posts</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Pages{" "}
          <span className="mx-2">&gt;</span> Blog Posts
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBlogs.size > 0 && (
        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{selectedBlogs.size}</span> blog post(s) selected
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleBulkStatusChange("PUBLISHED")}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isBulkUpdating || isBulkDeleting}
                >
                  {isBulkUpdating ? "Updating..." : "Publish Selected"}
                </Button>
                <Button
                  onClick={() => handleBulkStatusChange("DRAFT")}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  disabled={isBulkUpdating || isBulkDeleting}
                >
                  {isBulkUpdating ? "Updating..." : "Draft Selected"}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isBulkDeleting || isBulkUpdating}
                >
                  {isBulkDeleting ? "Deleting..." : "Bulk Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBlogs(new Set())}
                  disabled={isBulkDeleting || isBulkUpdating}
                >
                  Clear Selection
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
            {/* Left side: Entries and Bulk Action */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Entries Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Showing</label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 -ml-6 pointer-events-none" />
                <label className="text-sm text-gray-600 dark:text-gray-400">entries</label>
              </div>
            </div>

            {/* Right side: Filters, Search, Export, and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-3xl">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>

              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search here..."
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      // Update URL to sync with AdminHeader
                      const params = new URLSearchParams(searchParams.toString());
                      if (value.trim()) {
                        params.set("search", value);
                      } else {
                        params.delete("search");
                      }
                      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
                      router.replace(newUrl, { scroll: false });
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isExporting || filteredBlogs.length === 0}
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>

              {/* Add New Button */}
              <Link href="/admin/blogs/new" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add new
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        paginatedBlogs.length > 0 &&
                        paginatedBlogs.every((b) => selectedBlogs.has(b.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Blog Post
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Author
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("publishedAt")}
                  >
                    <div className="flex items-center gap-1">
                      Published Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedBlogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p>No blog posts found</p>
                        <Link href="/admin/blogs/new">
                          <Button className="mt-2 bg-blue-600 hover:bg-blue-700">
                            Create your first blog post
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBlogs.map((blog) => (
                    <tr
                      key={blog.id}
                      onClick={() => handleRowClick(blog.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      {/* Checkbox */}
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBlogs.has(blog.id)}
                          onChange={() => handleSelectBlog(blog.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 cursor-pointer"
                        />
                      </td>

                      {/* Blog Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            {blog.image ? (
                              <Image
                                src={blog.image}
                                alt={blog.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <FileText className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                              {blog.title}
                            </p>
                            {blog.excerpt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                                {blog.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {blog.author || "N/A"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            blog.status === "PUBLISHED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {blog.status}
                        </span>
                      </td>

                      {/* Published Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(blog.publishedAt)}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(blog.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {blog.status === "PUBLISHED" && (
                            <Link
                              href={`/blog/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                title="View blog post"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/admin/blogs/${blog.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(blog.id);
                            }}
                            disabled={isDuplicating === blog.id}
                            title="Duplicate blog post"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(blog.id);
                            }}
                            disabled={deletingId === blog.id}
                          >
                            {deletingId === blog.id ? "Deleting..." : "Delete"}
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
          {filteredBlogs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startRecord} to {endRecord} in {totalRecords} records
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
    </div>
  );
}
