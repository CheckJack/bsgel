"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Users,
  X,
  Loader2,
} from "lucide-react";

interface Certification {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
}

type SortField = "name" | "userCount" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";

export default function AdminCertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
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
    fetchCertifications();
  }, [debouncedSearchQuery, currentPage, entriesPerPage, statusFilter, sortField, sortDirection]);

  const fetchCertifications = async () => {
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

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const res = await fetch(`/api/certifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCertifications(Array.isArray(data.certifications) ? data.certifications : []);
        setPagination(data.pagination || pagination);
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to fetch certifications", "error");
        setCertifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch certifications:", error);
      toast("Failed to fetch certifications. Please try again.", "error");
      setCertifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (certificationId: string, page: number = 1) => {
    try {
      setUsersLoading(true);
      const res = await fetch(`/api/certifications/${certificationId}/users?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setUsersPagination(data.pagination || usersPagination);
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to fetch users", "error");
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast("Failed to fetch users. Please try again.", "error");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleViewUsers = async (certification: Certification) => {
    setSelectedCertification(certification);
    setShowUsersModal(true);
    setUsersPage(1);
    await fetchUsers(certification.id, 1);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingStatus(id);
    try {
      const res = await fetch(`/api/certifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCertifications((prev) =>
          prev.map((cert) => (cert.id === id ? updated : cert))
        );
        toast(
          `Certification ${!currentStatus ? "activated" : "deactivated"} successfully`,
          "success"
        );
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast("Failed to update status. Please try again.", "error");
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the certification "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/certifications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Certification deleted successfully", "success");
        fetchCertifications();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete certification", "error");
      }
    } catch (error) {
      console.error("Failed to delete certification:", error);
      toast("Failed to delete certification. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />
    );
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

  // Truncate description
  const truncateDescription = (text: string | null, maxLength: number = 80) => {
    if (!text) return "—";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div>
      {/* Header with Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          All Certifications
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Certifications{" "}
          <span className="mx-2">&gt;</span> All Certifications
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Left side: Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Entries Per Page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            {/* Right side: Search and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-2xl">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search certifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Add New Button */}
              <Link href="/admin/certifications/new" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add new
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          {isLoading && certifications.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !Array.isArray(certifications) || certifications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No certifications found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {debouncedSearchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first certification"}
                </p>
                {!debouncedSearchQuery && statusFilter === "all" && (
                  <Link href="/admin/certifications/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Certification
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          Name {getSortIcon("name")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Categories
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("userCount")}
                          className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          Users {getSortIcon("userCount")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          Created {getSortIcon("createdAt")}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {certifications.map((certification) => (
                      <tr
                        key={certification.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Name Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                {certification.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Description Column */}
                        <td className="px-6 py-4">
                          <span
                            className="text-sm text-gray-900 dark:text-gray-100"
                            title={certification.description || undefined}
                          >
                            {truncateDescription(certification.description)}
                          </span>
                        </td>

                        {/* Categories Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {certification.categories.length > 0 ? (
                              certification.categories.map((category) => (
                                <span
                                  key={category.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                >
                                  {category.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                            )}
                          </div>
                        </td>

                        {/* Users Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewUsers(certification)}
                            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            disabled={certification.userCount === 0}
                          >
                            <Users className="h-4 w-4" />
                            {certification.userCount}
                          </button>
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleToggleStatus(certification.id, certification.isActive)
                              }
                              disabled={togglingStatus === certification.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                certification.isActive
                                  ? "bg-green-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              } ${togglingStatus === certification.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                              title={
                                certification.isActive
                                  ? "Click to deactivate"
                                  : "Click to activate"
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  certification.isActive ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-medium ${
                                certification.isActive
                                  ? "text-green-800 dark:text-green-200"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {certification.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>

                        {/* Created Date Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(certification.createdAt)}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/certifications/${certification.id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() =>
                                handleDelete(certification.id, certification.name)
                              }
                              disabled={deletingId === certification.id}
                            >
                              {deletingId === certification.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {Math.min((currentPage - 1) * entriesPerPage + 1, pagination.total)}{" "}
                      to {Math.min(currentPage * entriesPerPage, pagination.total)} of{" "}
                      {pagination.total} certifications
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded text-sm ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={currentPage === pagination.totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Users Modal */}
      {showUsersModal && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Users with {selectedCertification.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {usersPagination.total} user{usersPagination.total !== 1 ? "s" : ""} total
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUsersModal(false);
                    setSelectedCertification(null);
                    setUsers([]);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Users List */}
              <div className="flex-1 overflow-y-auto p-6">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No users have this certification
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            Orders
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            Total Spent
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {user.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {user.email}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {user.orderCount}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(user.totalSpent)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {usersPagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Page {usersPage} of {usersPagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = Math.max(1, usersPage - 1);
                          setUsersPage(newPage);
                          fetchUsers(selectedCertification.id, newPage);
                        }}
                        disabled={usersPage === 1 || usersLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = Math.min(usersPagination.totalPages, usersPage + 1);
                          setUsersPage(newPage);
                          fetchUsers(selectedCertification.id, newPage);
                        }}
                        disabled={usersPage === usersPagination.totalPages || usersLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
