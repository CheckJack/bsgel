"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
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
  RefreshCw,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Building2,
  Star,
  Users,
  Calendar,
  CheckSquare,
  Square,
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
type SortField = "name" | "city" | "status" | "createdAt" | "isBioDiamond";
type SortDirection = "asc" | "desc";

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [bioDiamondFilter, setBioDiamondFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSalons, setSelectedSalons] = useState<Set<string>>(new Set());
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Salon>>({});

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    filterAndSortSalons();
  }, [salons, searchQuery, statusFilter, cityFilter, bioDiamondFilter, activeFilter, sortField, sortDirection]);

  const fetchSalons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/salons");
      if (res.ok) {
        const data = await res.json();
        setSalons(data || []);
      } else {
        toast("Failed to fetch salons", "error");
      }
    } catch (error) {
      console.error("Failed to fetch salons:", error);
      toast("Failed to fetch salons. Please try again.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSalons();
  };

  const filterAndSortSalons = () => {
    let filtered = [...salons];

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((salon) => salon.status === statusFilter);
    }

    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter((salon) =>
        salon.city.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Apply Bio Diamond filter
    if (bioDiamondFilter !== "all") {
      filtered = filtered.filter((salon) =>
        bioDiamondFilter === "yes" ? salon.isBioDiamond : !salon.isBioDiamond
      );
    }

    // Apply active filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((salon) =>
        activeFilter === "active" ? salon.isActive : !salon.isActive
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (salon) =>
          salon.name.toLowerCase().includes(query) ||
          salon.city.toLowerCase().includes(query) ||
          salon.address.toLowerCase().includes(query) ||
          salon.email?.toLowerCase().includes(query) ||
          salon.phone?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "city":
          aValue = a.city.toLowerCase();
          bValue = b.city.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "isBioDiamond":
          aValue = a.isBioDiamond ? 1 : 0;
          bValue = b.isBioDiamond ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredSalons(filtered);
    setCurrentPage(1); // Reset to first page on filter/sort change
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const handleReview = async () => {
    if (!selectedSalon || !reviewAction) return;

    if (reviewAction === "reject" && !rejectionReason.trim()) {
      toast("Please provide a reason for rejection", "warning");
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
        toast(
          `Salon ${reviewAction === "approve" ? "approved" : "rejected"} successfully`,
          "success"
        );
        await fetchSalons();
        setShowReviewModal(false);
        setShowDetailModal(false);
        setSelectedSalon(null);
        setReviewAction(null);
        setRejectionReason("");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to process review", "error");
      }
    } catch (error) {
      console.error("Failed to review salon:", error);
      toast("Failed to process review. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject" | "delete" | "activate" | "deactivate") => {
    if (selectedSalons.size === 0) {
      toast("Please select at least one salon", "warning");
      return;
    }

    if (action === "delete") {
      if (!confirm(`Are you sure you want to delete ${selectedSalons.size} salon(s)? This action cannot be undone.`)) {
        return;
      }
    } else if (action === "reject") {
      const reason = prompt("Please provide a reason for rejection:");
      if (!reason || !reason.trim()) {
        toast("Rejection reason is required", "warning");
        return;
      }
      await performBulkAction(action, reason);
      return;
    }

    await performBulkAction(action);
  };

  const performBulkAction = async (
    action: "approve" | "reject" | "delete" | "activate" | "deactivate",
    rejectionReason?: string
  ) => {
    setIsBulkProcessing(true);
    try {
      if (action === "delete") {
        const res = await fetch("/api/salons/bulk", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salonIds: Array.from(selectedSalons),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          toast(`Successfully deleted ${data.count} salon(s)`, "success");
          setSelectedSalons(new Set());
          await fetchSalons();
        } else {
          const data = await res.json();
          toast(data.error || "Failed to delete salons", "error");
        }
      } else {
        const res = await fetch("/api/salons/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salonIds: Array.from(selectedSalons),
            action,
            rejectionReason,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const actionText =
            action === "approve"
              ? "approved"
              : action === "reject"
              ? "rejected"
              : action === "activate"
              ? "activated"
              : "deactivated";
          toast(`Successfully ${actionText} ${data.count} salon(s)`, "success");
          setSelectedSalons(new Set());
          await fetchSalons();
        } else {
          const data = await res.json();
          toast(data.error || `Failed to ${action} salons`, "error");
        }
      }
    } catch (error) {
      console.error(`Failed to bulk ${action} salons:`, error);
      toast(`Failed to ${action} salons. Please try again.`, "error");
    } finally {
      setIsBulkProcessing(false);
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
        toast("Salon deleted successfully", "success");
        await fetchSalons();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete salon", "error");
      }
    } catch (error) {
      console.error("Failed to delete salon:", error);
      toast("Failed to delete salon. Please try again.", "error");
    }
  };

  const handleEdit = async () => {
    if (!selectedSalon) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/salons/${selectedSalon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        toast("Salon updated successfully", "success");
        await fetchSalons();
        setShowEditModal(false);
        setSelectedSalon(null);
        setEditFormData({});
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update salon", "error");
      }
    } catch (error) {
      console.error("Failed to update salon:", error);
      toast("Failed to update salon. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = [
        "ID",
        "Name",
        "Address",
        "City",
        "Postal Code",
        "Phone",
        "Email",
        "Website",
        "Status",
        "Active",
        "Bio Diamond",
        "Created At",
        "Owner",
      ];

      const rows = filteredSalons.map((salon) => [
        salon.id,
        salon.name,
        salon.address,
        salon.city,
        salon.postalCode || "",
        salon.phone || "",
        salon.email || "",
        salon.website || "",
        salon.status,
        salon.isActive ? "Yes" : "No",
        salon.isBioDiamond ? "Yes" : "No",
        new Date(salon.createdAt).toLocaleString(),
        salon.user?.name || salon.user?.email || "",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `salons_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast(`Exported ${filteredSalons.length} salons to CSV`, "success");
    } catch (error) {
      console.error("Failed to export salons:", error);
      toast("Failed to export salons", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setCityFilter("");
    setBioDiamondFilter("all");
    setActiveFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    cityFilter !== "" ||
    bioDiamondFilter !== "all" ||
    activeFilter !== "all";

  const toggleSelectAll = () => {
    if (selectedSalons.size === paginatedSalons.length) {
      setSelectedSalons(new Set());
    } else {
      setSelectedSalons(new Set(paginatedSalons.map((s) => s.id)));
    }
  };

  const toggleSelectSalon = (id: string) => {
    const newSelected = new Set(selectedSalons);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSalons(newSelected);
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

  // Statistics
  const stats = useMemo(() => {
    const total = salons.length;
    const pending = salons.filter((s) => s.status === "PENDING_REVIEW").length;
    const approved = salons.filter((s) => s.status === "APPROVED").length;
    const rejected = salons.filter((s) => s.status === "REJECTED").length;
    const bioDiamond = salons.filter((s) => s.isBioDiamond).length;
    const active = salons.filter((s) => s.isActive).length;

    return { total, pending, approved, rejected, bioDiamond, active };
  }, [salons]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = Array.from(new Set(salons.map((s) => s.city))).sort();
    return cities;
  }, [salons]);

  // Pagination
  const totalPages = Math.ceil(filteredSalons.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedSalons = filteredSalons.slice(startIndex, endIndex);

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
        {stats.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {stats.pending} pending review{stats.pending !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Salons</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bio Diamond</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.bioDiamond}</p>
              </div>
              <Star className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedSalons.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{selectedSalons.size}</span> salon(s) selected
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleBulkAction("approve")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isBulkProcessing}
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleBulkAction("reject")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isBulkProcessing}
                  size="sm"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleBulkAction("activate")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isBulkProcessing}
                  size="sm"
                >
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkAction("deactivate")}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                  disabled={isBulkProcessing}
                  size="sm"
                >
                  Deactivate
                </Button>
                <Button
                  onClick={() => handleBulkAction("delete")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isBulkProcessing}
                  size="sm"
                >
                  {isBulkProcessing ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSalons(new Set())}
                  disabled={isBulkProcessing}
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search salons by name, city, address, email, or phone..."
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
                <option value="PENDING_REVIEW">Pending Review ({stats.pending})</option>
                <option value="APPROVED">Approved ({stats.approved})</option>
                <option value="REJECTED">Rejected ({stats.rejected})</option>
              </select>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {/* Bio Diamond Filter */}
              <select
                value={bioDiamondFilter}
                onChange={(e) => setBioDiamondFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Salons</option>
                <option value="yes">Bio Diamond Only</option>
                <option value="no">Non-Bio Diamond</option>
              </select>

              {/* Active Filter */}
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Show</label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <label className="text-sm text-gray-600 dark:text-gray-400">entries</label>
              </div>

              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || filteredSalons.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  size="sm"
                >
                  <FileDown className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredSalons.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(endIndex, filteredSalons.length)} of {filteredSalons.length} salons
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center"
                      aria-label="Select all"
                    >
                      {selectedSalons.size === paginatedSalons.length && paginatedSalons.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Salon
                      {getSortIcon("name")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("city")}
                      className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Location
                      {getSortIcon("city")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Status
                      {getSortIcon("status")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Created
                      {getSortIcon("createdAt")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedSalons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
                        <button
                          onClick={() => toggleSelectSalon(salon.id)}
                          className="flex items-center justify-center"
                          aria-label={`Select ${salon.name}`}
                        >
                          {selectedSalons.has(salon.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </td>
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
                              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Bio Diamond
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{salon.city}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{salon.address}</div>
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
                        {!salon.isActive && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inactive</div>
                        )}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSalon(salon);
                              setEditFormData({
                                name: salon.name,
                                address: salon.address,
                                city: salon.city,
                                postalCode: salon.postalCode,
                                phone: salon.phone,
                                email: salon.email,
                                website: salon.website,
                                description: salon.description,
                                isBioDiamond: salon.isBioDiamond,
                                isActive: salon.isActive,
                              });
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
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

      {/* Edit Modal */}
      {showEditModal && selectedSalon && (
        <EditSalonModal
          salon={selectedSalon}
          formData={editFormData}
          onFormDataChange={setEditFormData}
          onSave={handleEdit}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedSalon(null);
            setEditFormData({});
          }}
          isProcessing={isProcessing}
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
                    <span className="block text-red-600 mt-1">Reason: {salon.rejectionReason}</span>
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

// Edit Modal Component
function EditSalonModal({
  salon,
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  isProcessing,
}: {
  salon: Salon;
  formData: Partial<Salon>;
  onFormDataChange: (data: Partial<Salon>) => void;
  onSave: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Salon</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name || ""}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => onFormDataChange({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Postal Code
                </label>
                <Input
                  value={formData.postalCode || ""}
                  onChange={(e) => onFormDataChange({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <Input
                  value={formData.website || ""}
                  onChange={(e) => onFormDataChange({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isBioDiamond || false}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, isBioDiamond: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bio Diamond</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive !== undefined ? formData.isActive : true}
                  onChange={(e) => onFormDataChange({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
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
