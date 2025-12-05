"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Plus, Eye, EyeOff, X, FileText, CheckCircle, XCircle, Download, Pencil, Trash2, Ban, CheckCircle2 } from "lucide-react";

interface Certification {
  id: string;
  name: string;
  description: string | null;
}

interface Customer {
  id: string;
  email: string;
  name: string | null;
  role: string;
  certification: Certification | null;
  certificateUrl: string | null;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
}

interface BannedEmail {
  id: string;
  email: string;
  reason: string | null;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    certificationId: "" as string | null,
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    certificationId: "" as string | null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [bannedEmails, setBannedEmails] = useState<Set<string>>(new Set());
  const [isBanning, setIsBanning] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [customerToBan, setCustomerToBan] = useState<Customer | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    fetchCustomers();
    fetchBannedEmails();
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const res = await fetch("/api/certifications?isActive=true");
      if (res.ok) {
        const data = await res.json();
        setCertifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch certifications:", error);
    }
  };

  const fetchBannedEmails = async () => {
    try {
      const res = await fetch("/api/banned-emails");
      if (res.ok) {
        const data: BannedEmail[] = await res.json();
        const emailSet = new Set(data.map((item) => item.email.toLowerCase()));
        setBannedEmails(emailSet);
      }
    } catch (error) {
      console.error("Failed to fetch banned emails:", error);
    }
  };

  useEffect(() => {
    // Filter customers based on search query
    let filtered = customers;

    if (searchQuery.trim()) {
      filtered = customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      // Only fetch USER role customers (people who buy)
      const res = await fetch("/api/users?role=USER");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        setFilteredCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          certificationId: formData.certificationId || null,
        }),
      });

      if (res.ok) {
        // Reset form and close modal
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          certificationId: null,
        });
        setShowAddModal(false);
        // Refresh customers list
        await fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create customer");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleValidateCertificate = async (customerId: string, approve: boolean) => {
    setIsValidating(true);
    try {
      // Find a certification to assign (you may want to make this more specific)
      const professionalCert = certifications.find(c => c.name.toLowerCase().includes("professional"));
      const res = await fetch(`/api/users/${customerId}/certification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificationId: approve && professionalCert ? professionalCert.id : null,
        }),
      });

      if (res.ok) {
        await fetchCustomers();
        if (selectedCustomer?.id === customerId) {
          const updatedCustomer = await res.json();
          setSelectedCustomer(updatedCustomer);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update certification");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadCertificate = (certificateUrl: string | null) => {
    if (!certificateUrl) return;
    
    // If it's a base64 data URL, create a download link
    if (certificateUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = certificateUrl;
      link.download = `certificate-${selectedCustomer?.id || "unknown"}.${certificateUrl.includes("pdf") ? "pdf" : "png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // If it's a regular URL, open in new tab
      window.open(certificateUrl, "_blank");
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name || "",
      email: customer.email,
      password: "",
      confirmPassword: "",
      certificationId: customer.certification?.id || null,
    });
    setShowEditModal(true);
    setError("");
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editFormData.name || !editFormData.email) {
      setError("Please fill in all required fields");
      return;
    }

    if (editFormData.password && editFormData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (editFormData.password !== editFormData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email,
        certificationId: editFormData.certificationId || null,
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const res = await fetch(`/api/users/${selectedCustomer?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setShowEditModal(false);
        setSelectedCustomer(null);
        await fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update customer");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
    setError("");
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/users/${customerToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setCustomerToDelete(null);
        await fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete customer");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBanClick = (customer: Customer) => {
    setCustomerToBan(customer);
    setBanReason("");
    setShowBanModal(true);
    setError("");
  };

  const handleUnbanClick = async (customer: Customer) => {
    setIsBanning(true);
    setError("");

    try {
      const res = await fetch(`/api/banned-emails?email=${encodeURIComponent(customer.email)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Update banned emails set
        const newBannedEmails = new Set(bannedEmails);
        newBannedEmails.delete(customer.email.toLowerCase());
        setBannedEmails(newBannedEmails);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to unban customer");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsBanning(false);
    }
  };

  const handleConfirmBan = async () => {
    if (!customerToBan) return;

    setIsBanning(true);
    setError("");

    try {
      const res = await fetch("/api/banned-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerToBan.email,
          reason: banReason || null,
        }),
      });

      if (res.ok) {
        // Update banned emails set
        const newBannedEmails = new Set(bannedEmails);
        newBannedEmails.add(customerToBan.email.toLowerCase());
        setBannedEmails(newBannedEmails);
        setShowBanModal(false);
        setCustomerToBan(null);
        setBanReason("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to ban customer");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsBanning(false);
    }
  };

  const isCustomerBanned = (email: string) => {
    return bannedEmails.has(email.toLowerCase());
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

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

  // Generate random avatar color based on customer id
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

  // Format certification name for display
  const formatCertification = (certification: Certification | null): string => {
    return certification ? certification.name : "None";
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Dashboard <span className="mx-2">&gt;</span> Customers
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Certification
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => {
                    const isBanned = isCustomerBanned(customer.email);
                    return (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isBanned
                          ? "bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500"
                          : customer.certificateUrl
                          ? "bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500"
                          : ""
                      }`}
                    >
                      {/* Customer Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${getAvatarColor(
                              customer.id
                            )} flex items-center justify-center text-white font-semibold text-sm`}
                          >
                            {getInitials(customer.name, customer.email)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {customer.name || customer.email.split("@")[0]}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Customer
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Total Spent Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatPrice(customer.totalSpent)}
                        </span>
                      </td>

                      {/* Orders Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {customer.orderCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Email Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {customer.email}
                          </span>
                          {isBanned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              <Ban className="h-3 w-3" />
                              Banned
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Certification Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {formatCertification(customer.certification)}
                          </span>
                          {customer.certificateUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <FileText className="h-3 w-3" />
                              Certificate
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(customer);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {isBanned ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnbanClick(customer);
                              }}
                              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                              title="Unban User"
                              disabled={isBanning}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBanClick(customer);
                              }}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Ban User"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(customer);
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete"
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
          {filteredCustomers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {entriesPerPage} entries
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Add New Customer
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
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

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Customer name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="certification"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Certification
                  </label>
                  <select
                    id="certification"
                    value={formData.certificationId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificationId: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {certifications.map((cert) => (
                      <option key={cert.id} value={cert.id}>
                        {cert.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pr-10"
                      required
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

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pr-10"
                      required
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setError("");
                      setFormData({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        certification: "NONE",
                      });
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Creating..." : "Create Customer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Customer Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Avatar and Basic Info */}
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${getAvatarColor(
                      selectedCustomer.id
                    )} flex items-center justify-center text-white font-semibold text-2xl`}
                  >
                    {getInitials(selectedCustomer.name, selectedCustomer.email)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedCustomer.name || selectedCustomer.email.split("@")[0]}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Customer ID: {selectedCustomer.id}
                    </p>
                  </div>
                </div>

                {/* Customer Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {selectedCustomer.name || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {selectedCustomer.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Spent
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg font-semibold">
                      {formatPrice(selectedCustomer.totalSpent)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Orders
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg font-semibold">
                      {selectedCustomer.orderCount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Created
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      {selectedCustomer.role}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Certification
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg font-semibold">
                      {formatCertification(selectedCustomer.certification)}
                    </p>
                  </div>
                </div>

                {/* Certificate Section - Only show if certificate exists */}
                {selectedCustomer.certificateUrl && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Certificate
                    </label>
                    <div className="space-y-4">
                      {/* Certificate Preview */}
                      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                        {selectedCustomer.certificateUrl.startsWith("data:image/") ? (
                          <img
                            src={selectedCustomer.certificateUrl}
                            alt="Certificate"
                            className="max-w-full h-auto max-h-96 mx-auto rounded"
                          />
                        ) : selectedCustomer.certificateUrl.startsWith("data:application/pdf") ? (
                          <div className="relative w-full" style={{ minHeight: "400px" }}>
                            <iframe
                              src={selectedCustomer.certificateUrl}
                              className="w-full h-full min-h-[400px] rounded border-0"
                              title="Certificate PDF"
                              style={{ aspectRatio: "4/3" }}
                            />
                          </div>
                        ) : (
                          <div className="relative w-full" style={{ minHeight: "400px" }}>
                            <iframe
                              src={selectedCustomer.certificateUrl}
                              className="w-full h-full min-h-[400px] rounded border-0"
                              title="Certificate PDF"
                              style={{ aspectRatio: "4/3" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Certificate Actions */}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => handleDownloadCertificate(selectedCustomer.certificateUrl)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-4 w-4" />
                          Download Certificate
                        </Button>

                        {/* Certificate validation buttons can be added back if needed */}
                      </div>
                    </div>
                  </div>
                )}

                {/* Average Order Value */}
                {selectedCustomer.orderCount > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Average Order Value
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatPrice(selectedCustomer.totalSpent / selectedCustomer.orderCount)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Customer
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCustomer(null);
                    setError("");
                    setEditFormData({
                      name: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      certificationId: null,
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

              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Name *
                  </label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder="Customer name"
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
                    Email *
                  </label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="customer@example.com"
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
                    htmlFor="edit-certification"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Certification
                  </label>
                  <select
                    id="edit-certification"
                    value={editFormData.certificationId || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        certificationId: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {certifications.map((cert) => (
                      <option key={cert.id} value={cert.id}>
                        {cert.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    New Password (leave blank to keep current)
                  </label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, password: e.target.value })
                      }
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showEditPassword ? (
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
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="edit-confirmPassword"
                        type={showEditConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
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
                          setShowEditConfirmPassword(!showEditConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showEditConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCustomer(null);
                      setError("");
                      setEditFormData({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        certification: "NONE",
                      });
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Updating..." : "Update Customer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Delete Customer
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCustomerToDelete(null);
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

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete this customer? This action cannot be undone.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {customerToDelete.name || customerToDelete.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {customerToDelete.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCustomerToDelete(null);
                    setError("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Delete Customer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ban Customer Modal */}
      {showBanModal && customerToBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Ban Customer
                </h2>
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setCustomerToBan(null);
                    setBanReason("");
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

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to ban this customer? They will not be able to create orders or create a new account with this email.
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {customerToBan.name || customerToBan.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {customerToBan.email}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="ban-reason"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Reason (optional)
                  </label>
                  <textarea
                    id="ban-reason"
                    placeholder="Enter reason for banning this customer..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowBanModal(false);
                    setCustomerToBan(null);
                    setBanReason("");
                    setError("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                  disabled={isBanning}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmBan}
                  disabled={isBanning}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isBanning ? "Banning..." : "Ban Customer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

