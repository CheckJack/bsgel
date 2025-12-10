"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, EyeOff, X, Eye as ViewIcon, CheckCircle2, XCircle, Check } from "lucide-react";

interface Permission {
  addProduct?: "allow" | "deny";
  updateProduct?: "allow" | "deny";
  deleteProduct?: "allow" | "deny";
  applyDiscount?: "allow" | "deny";
  createCoupon?: "allow" | "deny";
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions?: Permission | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    isActive: true,
  });
  const [editPermissions, setEditPermissions] = useState<Permission>({
    addProduct: "allow",
    updateProduct: "deny",
    deleteProduct: "allow",
    applyDiscount: "deny",
    createCoupon: "deny",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    let filtered = users;

    if (searchQuery.trim()) {
      filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      // Only fetch ADMIN users (backend workers)
      const res = await fetch("/api/users?role=ADMIN");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const paginationStart = filteredUsers.length > 0 ? startIndex + 1 : 0;
  const paginationEnd = Math.min(endIndex, filteredUsers.length);

  // Generate avatar initials
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  // Generate random avatar color based on user id
  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      confirmPassword: "",
      isActive: user.isActive ?? true,
    });
    setEditPermissions((user.permissions as Permission) || {
      addProduct: "allow",
      updateProduct: "deny",
      deleteProduct: "allow",
      applyDiscount: "deny",
      createCoupon: "deny",
    });
    setShowEditModal(true);
    setError("");
    setSuccessMessage("");
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handlePermissionChange = (
    permission: keyof Permission,
    value: "allow" | "deny"
  ) => {
    setEditPermissions((prev) => ({
      ...prev,
      [permission]: value,
    }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!editFormData.name || !editFormData.email) {
      setError(t("form.fillAllFields"));
      return;
    }

    if (editFormData.password && editFormData.password.length < 8) {
      setError(t("form.passwordTooShort"));
      return;
    }

    // Enhanced password validation
    if (editFormData.password) {
      const hasUpperCase = /[A-Z]/.test(editFormData.password);
      const hasLowerCase = /[a-z]/.test(editFormData.password);
      const hasNumber = /[0-9]/.test(editFormData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(editFormData.password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        setError(t("users.passwordRequirements"));
        return;
      }
    }

    if (editFormData.password !== editFormData.confirmPassword) {
        setError(t("form.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email,
        role: "ADMIN", // Keep as ADMIN
        permissions: editPermissions,
        isActive: editFormData.isActive,
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const res = await fetch(`/api/users/${selectedUser?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setSuccessMessage(t("users.updateSuccess"));
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedUser(null);
          setSuccessMessage("");
          fetchUsers();
        }, 1000);
      } else {
        const data = await res.json();
        setError(data.error || t("users.updateError"));
      }
    } catch (error) {
        setError(t("form.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setError("");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage(t("users.deleteSuccess"));
        setTimeout(() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
          setSuccessMessage("");
          fetchUsers();
        }, 1000);
      } else {
        const data = await res.json();
        setError(data.error || t("users.deleteError"));
      }
    } catch (error) {
        setError(t("form.errorOccurred"));
    } finally {
      setIsDeleting(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("users.backendUsers")}</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t("sidebar.dashboard")} <span className="mx-2">&gt;</span> {t("sidebar.users")}{" "}
          <span className="mx-2">&gt;</span> {t("users.backendUsers")}
        </div>
      </div>

      {/* Search and Add Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4"
                />
              </div>
            </div>

            {/* Add New Button */}
            <div className="flex-shrink-0">
              <Link href="/admin/users/new">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  + {t("users.newUser")}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("users.userName")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("common.status")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("common.email")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("users.permissions")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("users.createdAt")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-base font-medium">{t("users.noUsers")}</p>
                        <p className="text-sm">{t("common.tryAdjustingSearch")}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const isCurrentUser = session?.user?.id === user.id;
                    const permissions = (user.permissions as Permission) || {};
                    const permissionCount = Object.values(permissions).filter(p => p === "allow").length;
                    const totalPermissions = Object.keys(permissions).length || 5;
                    
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* User Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${getAvatarColor(
                                user.id
                              )} flex items-center justify-center text-white font-semibold text-sm`}
                            >
                              {getInitials(user.name, user.email)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {user.name || user.email.split("@")[0]}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {t("users.backendWorker")}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive !== false
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {user.isActive !== false ? t("users.active") : t("users.inactive")}
                          </span>
                        </td>

                        {/* Email Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {user.email}
                          </span>
                        </td>

                        {/* Permissions Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {t("users.permissionCount", { count: permissionCount, total: totalPermissions })}
                          </span>
                        </td>

                        {/* Created Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title={t("users.viewDetails")}
                            >
                              <ViewIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title={t("common.edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              disabled={isCurrentUser}
                              className={`p-2 rounded-lg transition-colors ${
                                isCurrentUser
                                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              }`}
                              title={isCurrentUser ? t("form.cannotDeleteOwnAccount") : t("common.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
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
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("table.showing")} {paginationStart}-{paginationEnd} {t("table.of")} {filteredUsers.length} {t("table.entries")}
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("users.editUser")}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setError("");
                    setSuccessMessage("");
                    setEditFormData({
                      name: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      isActive: true,
                    });
                    setEditPermissions({
                      addProduct: "allow",
                      updateProduct: "deny",
                      deleteProduct: "allow",
                      applyDiscount: "deny",
                      createCoupon: "deny",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("users.name")} *
                  </label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder={t("users.userName")}
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("users.email")} *
                  </label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder={t("users.emailPlaceholder")}
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("users.newPassword")} ({t("users.leaveBlankToKeep")})
                  </label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("users.enterNewPassword")}
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, password: e.target.value })
                      }
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {editFormData.password && (
                  <div>
                    <label
                      htmlFor="edit-confirmPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("users.confirmNewPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        id="edit-confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("users.confirmPassword")}
                        value={editFormData.confirmPassword}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("common.status")}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, isActive: true })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        editFormData.isActive
                          ? "bg-green-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {editFormData.isActive && <Check className="h-4 w-4" />}
                      {t("users.active")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, isActive: false })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        !editFormData.isActive
                          ? "bg-red-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {!editFormData.isActive && <Check className="h-4 w-4" />}
                      {t("users.inactive")}
                    </button>
                  </div>
                </div>

                {/* Permissions Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t("users.permissions")}
                  </label>
                  <div className="space-y-3">
                    {(["addProduct", "updateProduct", "deleteProduct", "applyDiscount", "createCoupon"] as const).map((permission) => (
                      <div key={permission}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          {t(`users.${permission}`)}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(permission, "allow")}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              editPermissions[permission] === "allow"
                                ? "bg-green-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {editPermissions[permission] === "allow" && <Check className="h-3 w-3" />}
                            {t("users.allow")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(permission, "deny")}
                            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              editPermissions[permission] === "deny"
                                ? "bg-red-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {editPermissions[permission] === "deny" && <Check className="h-3 w-3" />}
                            {t("users.deny")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setError("");
                      setSuccessMessage("");
                      setEditFormData({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        isActive: true,
                      });
                      setEditPermissions({
                        addProduct: "allow",
                        updateProduct: "deny",
                        deleteProduct: "allow",
                        applyDiscount: "deny",
                        createCoupon: "deny",
                      });
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("common.loading")}
                      </>
                    ) : (
                      t("users.updateUser")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("users.deleteUser")}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                    setError("");
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {successMessage}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {t("users.deleteConfirm")}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {userToDelete.name || userToDelete.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userToDelete.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                    setError("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  disabled={isDeleting}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("common.loading")}
                    </>
                  ) : (
                    t("users.deleteUser")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("users.userDetails")}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${getAvatarColor(
                      selectedUser.id
                    )} flex items-center justify-center text-white font-semibold text-lg`}
                  >
                    {getInitials(selectedUser.name, selectedUser.email)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedUser.name || selectedUser.email.split("@")[0]}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("common.status")}
                  </label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedUser.isActive !== false
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {selectedUser.isActive !== false ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t("users.active")}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        {t("users.inactive")}
                      </>
                    )}
                  </span>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("users.permissions")}
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                    {(["addProduct", "updateProduct", "deleteProduct", "applyDiscount", "createCoupon"] as const).map((permission) => {
                      const permValue = (selectedUser.permissions as Permission)?.[permission] || "deny";
                      return (
                        <div key={permission} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {t(`users.${permission}`)}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            permValue === "allow"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {permValue === "allow" ? t("users.allowed") : t("users.denied")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("users.createdAt")}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedUser.lastLoginAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("users.lastLogin")}
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(selectedUser.lastLoginAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("users.orderCount")}
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedUser.orderCount}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("users.totalSpent")}
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPrice(selectedUser.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedUser);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t("users.editUser")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                >
                  {t("common.close")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

