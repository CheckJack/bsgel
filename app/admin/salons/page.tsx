"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  logo?: string;
  images?: string[];
  description?: string;
  workingHours?: any;
  isActive: boolean;
  isBioDiamond?: boolean;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

type StatusFilter = "ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    filterSalons();
  }, [salons, searchQuery, statusFilter]);

  const fetchSalons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/salons");
      if (res.ok) {
        const data = await res.json();
        setSalons(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch salons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSalons = () => {
    let filtered = [...salons];

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((salon) => salon.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (salon) =>
          salon.name.toLowerCase().includes(query) ||
          salon.city.toLowerCase().includes(query) ||
          salon.address.toLowerCase().includes(query) ||
          salon.email?.toLowerCase().includes(query)
      );
    }

    setFilteredSalons(filtered);
    setCurrentPage(1); // Reset to first page on filter
  };

  const handleReview = async () => {
    if (!selectedSalon || !reviewAction) return;

    if (reviewAction === "reject" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/salons/${selectedSalon.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          rejectionReason: reviewAction === "reject" ? rejectionReason : null,
        }),
      });

      if (res.ok) {
        await fetchSalons();
        setShowReviewModal(false);
        setShowDetailModal(false);
        setSelectedSalon(null);
        setReviewAction(null);
        setRejectionReason("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process review");
      }
    } catch (error) {
      console.error("Failed to review salon:", error);
      alert("Failed to process review. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salon?")) {
      return;
    }

    try {
      const res = await fetch(`/api/salons/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchSalons();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete salon");
      }
    } catch (error) {
      console.error("Failed to delete salon:", error);
      alert("Failed to delete salon. Please try again.");
    }
  };

  const getStatusBadge = (status: Salon["status"]) => {
    const config = {
      PENDING_REVIEW: {
        icon: AlertCircle,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
        text: "Pending Review",
      },
      APPROVED: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
        text: "Approved",
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
        text: "Rejected",
      },
    };

    const statusConfig = config[status];
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="h-3 w-3" />
        {statusConfig.text}
      </span>
    );
  };

  const formatWorkingHours = (workingHours: any): string => {
    if (!workingHours || typeof workingHours !== "object") {
      return "Not specified";
    }

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayNames: { [key: string]: string } = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };

    const hoursList: string[] = [];
    days.forEach((day) => {
      const dayData = workingHours[day];
      if (dayData && !dayData.closed) {
        hoursList.push(`${dayNames[day]}: ${dayData.open || "?"}-${dayData.close || "?"}`);
      }
    });

    return hoursList.length > 0 ? hoursList.join(", ") : "Not specified";
  };

  // Pagination
  const totalPages = Math.ceil(filteredSalons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSalons = filteredSalons.slice(startIndex, endIndex);

  const pendingCount = salons.filter((s) => s.status === "PENDING_REVIEW").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Salons</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage salon listings and review pending requests
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {pendingCount} pending review{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search salons by name, city, address, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review ({pendingCount})</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Salons Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedSalons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No salons found
                    </td>
                  </tr>
                ) : (
                  paginatedSalons.map((salon) => (
                    <tr
                      key={salon.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {salon.image && (
                            <img
                              src={salon.image}
                              alt={salon.name}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {salon.name}
                            </div>
                            {salon.isBioDiamond && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                Bio Diamond
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {salon.city}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {salon.address}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {salon.phone || "—"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {salon.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(salon.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {salon.user?.name || salon.user?.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(salon.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSalon(salon);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {salon.status === "PENDING_REVIEW" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 border-green-300"
                                onClick={() => {
                                  setSelectedSalon(salon);
                                  setReviewAction("approve");
                                  setShowReviewModal(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 border-red-300"
                                onClick={() => {
                                  setSelectedSalon(salon);
                                  setReviewAction("reject");
                                  setShowReviewModal(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSalons.length)} of{" "}
                {filteredSalons.length} salons
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedSalon && (
        <SalonDetailModal
          salon={selectedSalon}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSalon(null);
          }}
          formatWorkingHours={formatWorkingHours}
          onRefresh={fetchSalons}
          onDelete={handleDelete}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSalon && reviewAction && (
        <ReviewModal
          salon={selectedSalon}
          action={reviewAction}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onConfirm={handleReview}
          onCancel={() => {
            setShowReviewModal(false);
            setReviewAction(null);
            setRejectionReason("");
          }}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

// Detail Modal Component
function SalonDetailModal({
  salon,
  onClose,
  formatWorkingHours,
  onRefresh,
  onDelete,
}: {
  salon: Salon;
  onClose: () => void;
  formatWorkingHours: (hours: any) => string;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salon.name}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Images */}
            {(salon.image || salon.logo || (salon.images && salon.images.length > 0)) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Images
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {salon.image && (
                    <div>
                      <img
                        src={salon.image}
                        alt="Main"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Main Image</p>
                    </div>
                  )}
                  {salon.logo && (
                    <div>
                      <img
                        src={salon.logo}
                        alt="Logo"
                        className="w-full h-32 object-contain bg-gray-100 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Logo</p>
                    </div>
                  )}
                  {salon.images?.map((img, idx) => (
                    <div key={idx}>
                      <img
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {salon.address}
                  <br />
                  {salon.city}
                  {salon.postalCode && `, ${salon.postalCode}`}
                </p>
              </div>
              {(salon.latitude || salon.longitude) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coordinates
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {salon.latitude}, {salon.longitude}
                  </p>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="grid md:grid-cols-2 gap-4">
              {salon.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{salon.phone}</p>
                </div>
              )}
              {salon.email && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{salon.email}</p>
                </div>
              )}
              {salon.website && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </h3>
                  <a
                    href={salon.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {salon.website}
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {salon.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">{salon.description}</p>
              </div>
            )}

            {/* Working Hours */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Working Hours
              </h3>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatWorkingHours(salon.workingHours)}
              </p>
            </div>

            {/* Status & Owner */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {salon.status}
                  {salon.rejectionReason && (
                    <span className="block text-red-600 mt-1">
                      Reason: {salon.rejectionReason}
                    </span>
                  )}
                </p>
              </div>
              {salon.user && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Owner
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {salon.user.name || salon.user.email}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this salon?")) {
                    onDelete(salon.id);
                    onClose();
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Review Modal Component
function ReviewModal({
  salon,
  action,
  rejectionReason,
  onRejectionReasonChange,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  salon: Salon;
  action: "approve" | "reject";
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {action === "approve" ? "Approve Salon" : "Reject Salon"}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {action === "approve"
              ? `Are you sure you want to approve "${salon.name}"? This will make it visible on the Find Your Salon page.`
              : `Are you sure you want to reject "${salon.name}"? Please provide a reason.`}
          </p>

          {action === "reject" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                placeholder="Please explain why this salon is being rejected..."
                rows={4}
                className="w-full"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing || (action === "reject" && !rejectionReason.trim())}
              className={
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : action === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

