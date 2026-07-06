"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  Plus,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Diamond,
  Calendar,
  CheckSquare,
  Square,
  Instagram,
  Facebook,
} from "lucide-react";

const SALON_IMAGE_SIZE_HINTS = {
  thumbnail: "Recommended: 800 × 400 px (2:1) — listing cards",
  logo: "Recommended: 512 × 512 px (1:1) — salon profile",
  banner: "Recommended: 1920 × 1080 px (16:9) — detail hero; center key content",
} as const;

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string | null;
  facebook?: string | null;
  pinterest?: string | null;
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

type EditSalonForm = Omit<Partial<Salon>, "image" | "logo"> & {
  image?: string | null;
  logo?: string | null;
};

type StatusFilter = "ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
type SortField = "name" | "city" | "status" | "createdAt" | "isBioDiamond";
type SortDirection = "asc" | "desc";

export default function AdminSalonsPage() {
  const searchParams = useSearchParams();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{type: 'main' | 'logo' | 'gallery', index?: number} | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editFormData, setEditFormData] = useState<EditSalonForm>({});
  const [createFormData, setCreateFormData] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    pinterest: "",
    description: "",
    latitude: "",
    longitude: "",
    isBioDiamond: false,
  });
  const [createThumbnail, setCreateThumbnail] = useState<string | null>(null);
  const [createLogo, setCreateLogo] = useState<string | null>(null);
  const [createBanner, setCreateBanner] = useState<string | null>(null);

  useEffect(() => {
    fetchSalons();
  }, []);

  /** Debounced geocode for Create Salon when address + postal code are set (city included when present). */
  useEffect(() => {
    if (!showCreateModal) return;
    const address = createFormData.address.trim();
    const postalCode = createFormData.postalCode.trim();
    const city = createFormData.city.trim();
    if (!address || !postalCode || address.length < 5 || postalCode.length < 4) {
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ address, postalCode });
        if (city) params.set("city", city);
        const res = await fetch(`/api/geocode?${params.toString()}`, { signal: ac.signal });
        const data = await res.json();
        if (!res.ok) return;
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setCreateFormData((prev) => ({
            ...prev,
            latitude: String(data.lat),
            longitude: String(data.lng),
          }));
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }, 900);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [showCreateModal, createFormData.address, createFormData.city, createFormData.postalCode]);

  /** Same geocoding while editing a salon (updates map coords when address / postal change). */
  useEffect(() => {
    if (!showEditModal || !selectedSalon) return;
    const address = (editFormData.address ?? "").trim();
    const postalCode = (editFormData.postalCode ?? "").trim();
    const city = (editFormData.city ?? "").trim();
    if (!address || !postalCode || address.length < 5 || postalCode.length < 4) {
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ address, postalCode });
        if (city) params.set("city", city);
        const res = await fetch(`/api/geocode?${params.toString()}`, { signal: ac.signal });
        const data = await res.json();
        if (!res.ok) return;
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setEditFormData((prev) => ({
            ...prev,
            latitude: data.lat,
            longitude: data.lng,
          }));
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }, 900);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [showEditModal, selectedSalon, editFormData.address, editFormData.city, editFormData.postalCode]);

  // Handle URL parameters for filter and salonId
  useEffect(() => {
    const filter = searchParams.get("filter");
    const salonId = searchParams.get("salonId");

    if (filter === "pending") {
      setStatusFilter("PENDING_REVIEW");
    }

    if (salonId && salons.length > 0) {
      const salon = salons.find((s) => s.id === salonId);
      if (salon) {
        setSelectedSalon(salon);
        setShowDetailModal(true);
      }
    }
  }, [searchParams, salons]);

  useEffect(() => {
    filterAndSortSalons();
  }, [salons, searchQuery, statusFilter, cityFilter, bioDiamondFilter, activeFilter, sortField, sortDirection]);

  const fetchSalons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/salons");
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Failed to fetch salons:", res.status, res.statusText, errorData);
        toast(`Failed to fetch salons: ${errorData.error || res.statusText} (${res.status})`, "error");
        setSalons([]);
        return;
      }
      
      const data = await res.json();
      console.log("✅ Salons fetched successfully:", Array.isArray(data) ? data.length : 0, "salons");
      setSalons(data || []);
    } catch (error: any) {
      console.error("❌ Error fetching salons:", error);
      toast(`Failed to fetch salons: ${error?.message || "Network error"}`, "error");
      setSalons([]);
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

    // Apply status filter (only if status field exists on salon)
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((salon) => {
        // Status field doesn't exist in database, so skip status filtering
        if (!('status' in salon)) return true;
        return salon.status === statusFilter;
      });
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
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/salons/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast("Salon deleted successfully", "success");
        await fetchSalons();
        setShowDeleteModal(false);
        setSelectedSalon(null);
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete salon", "error");
      }
    } catch (error) {
      console.error("Failed to delete salon:", error);
      toast("Failed to delete salon. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedSalon) return;

    setIsProcessing(true);
    try {
      // Track changes
      const changes: string[] = [];
      const originalSalon = selectedSalon;

      if (editFormData.name !== undefined && editFormData.name !== originalSalon.name) {
        changes.push(`Name: "${originalSalon.name}" → "${editFormData.name}"`);
      }
      if (editFormData.address !== undefined && editFormData.address !== originalSalon.address) {
        changes.push(`Address: "${originalSalon.address}" → "${editFormData.address}"`);
      }
      if (editFormData.city !== undefined && editFormData.city !== originalSalon.city) {
        changes.push(`City: "${originalSalon.city}" → "${editFormData.city}"`);
      }
      if (editFormData.postalCode !== undefined && editFormData.postalCode !== originalSalon.postalCode) {
        changes.push(`Postal Code: "${originalSalon.postalCode || 'N/A'}" → "${editFormData.postalCode || 'N/A'}"`);
      }
      if (editFormData.phone !== undefined && editFormData.phone !== originalSalon.phone) {
        changes.push(`Phone: "${originalSalon.phone || 'N/A'}" → "${editFormData.phone || 'N/A'}"`);
      }
      if (editFormData.email !== undefined && editFormData.email !== originalSalon.email) {
        changes.push(`Email: "${originalSalon.email || 'N/A'}" → "${editFormData.email || 'N/A'}"`);
      }
      if (editFormData.website !== undefined && editFormData.website !== originalSalon.website) {
        changes.push(`Website: "${originalSalon.website || 'N/A'}" → "${editFormData.website || 'N/A'}"`);
      }
      if (editFormData.instagram !== undefined && editFormData.instagram !== originalSalon.instagram) {
        changes.push("Instagram link updated");
      }
      if (editFormData.facebook !== undefined && editFormData.facebook !== originalSalon.facebook) {
        changes.push("Facebook link updated");
      }
      if (editFormData.pinterest !== undefined && editFormData.pinterest !== originalSalon.pinterest) {
        changes.push("Pinterest link updated");
      }
      {
        const latChanged =
          editFormData.latitude !== undefined &&
          Number(originalSalon.latitude ?? NaN) !== Number(editFormData.latitude ?? NaN);
        const lngChanged =
          editFormData.longitude !== undefined &&
          Number(originalSalon.longitude ?? NaN) !== Number(editFormData.longitude ?? NaN);
        if (latChanged || lngChanged) {
          changes.push("Map coordinates updated");
        }
      }
      if (editFormData.description !== undefined && editFormData.description !== originalSalon.description) {
        changes.push("Description was updated");
      }
      if (editFormData.image === null && originalSalon.image) {
        changes.push("Thumbnail was removed");
      }
      if (editFormData.logo === null && originalSalon.logo) {
        changes.push("Logo was removed");
      }
      if (editFormData.images !== undefined) {
        const originalCount = (originalSalon.images || []).length;
        const newCount = (editFormData.images || []).length;
        if (newCount < originalCount) {
          const removedCount = originalCount - newCount;
          changes.push(`Banner images: ${originalCount} → ${newCount} (${removedCount} removed)`);
        }
      }
      if (editFormData.isBioDiamond !== undefined && editFormData.isBioDiamond !== originalSalon.isBioDiamond) {
        changes.push(`Bio Diamond status: ${originalSalon.isBioDiamond ? 'Yes' : 'No'} → ${editFormData.isBioDiamond ? 'Yes' : 'No'}`);
      }
      if (editFormData.isActive !== undefined && editFormData.isActive !== originalSalon.isActive) {
        changes.push(`Active status: ${originalSalon.isActive ? 'Active' : 'Inactive'} → ${editFormData.isActive ? 'Active' : 'Inactive'}`);
      }

      const res = await fetch(`/api/salons/${selectedSalon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          changes: changes,
        }),
      });

      if (res.ok) {
        toast("Salon updated successfully", "success");
        await fetchSalons();
        // Refresh selectedSalon with updated data
        const updatedSalon = await fetch(`/api/salons/${selectedSalon.id}`).then(r => r.json());
        setSelectedSalon(updatedSalon);
        setShowEditModal(false);
        setShowDetailModal(true);
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

  const handleCreateSalon = async () => {
    if (!createFormData.name.trim() || !createFormData.address.trim() || !createFormData.city.trim()) {
      toast("Name, address, and city are required", "warning");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createFormData.name.trim(),
          address: createFormData.address.trim(),
          city: createFormData.city.trim(),
          postalCode: createFormData.postalCode.trim() || null,
          phone: createFormData.phone.trim() || null,
          email: createFormData.email.trim() || null,
          website: createFormData.website.trim() || null,
          instagram: createFormData.instagram.trim() || null,
          facebook: createFormData.facebook.trim() || null,
          pinterest: createFormData.pinterest.trim() || null,
          description: createFormData.description.trim() || null,
          latitude: createFormData.latitude ? parseFloat(createFormData.latitude) : null,
          longitude: createFormData.longitude ? parseFloat(createFormData.longitude) : null,
          isBioDiamond: createFormData.isBioDiamond,
          image: createThumbnail,
          logo: createLogo,
          images: createBanner ? [createBanner] : [],
        }),
      });

      if (res.ok) {
        toast("Salon created successfully", "success");
        setShowCreateModal(false);
        setCreateFormData({
          name: "",
          address: "",
          city: "",
          postalCode: "",
          phone: "",
          email: "",
          website: "",
          instagram: "",
          facebook: "",
          pinterest: "",
          description: "",
          latitude: "",
          longitude: "",
          isBioDiamond: false,
        });
        setCreateThumbnail(null);
        setCreateLogo(null);
        setCreateBanner(null);
        await fetchSalons();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to create salon", "error");
      }
    } catch (error) {
      console.error("Failed to create salon:", error);
      toast("Failed to create salon", "error");
    } finally {
      setIsCreating(false);
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
    const config: Record<string, { icon: any; color: string; text: string }> = {
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

    const statusConfig = config[status] || config.APPROVED; // Default to APPROVED if status is undefined
    const Icon = statusConfig?.icon || CheckCircle;

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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Salon
          </Button>
          {stats.pending > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {stats.pending} pending review{stats.pending !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Create Salon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create Salon</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Name *"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                />
                <Input
                  placeholder="City *"
                  value={createFormData.city}
                  onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                />
              </div>
              <Input
                placeholder="Address *"
                value={createFormData.address}
                onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Postal Code"
                  value={createFormData.postalCode}
                  onChange={(e) => setCreateFormData({ ...createFormData, postalCode: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                />
                <Input
                  placeholder="Website (optional)"
                  value={createFormData.website}
                  onChange={(e) => setCreateFormData({ ...createFormData, website: e.target.value })}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Social links (optional). Use full URLs, e.g. https://www.instagram.com/your_salon
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Instagram URL"
                  value={createFormData.instagram}
                  onChange={(e) => setCreateFormData({ ...createFormData, instagram: e.target.value })}
                />
                <Input
                  placeholder="Facebook URL"
                  value={createFormData.facebook}
                  onChange={(e) => setCreateFormData({ ...createFormData, facebook: e.target.value })}
                />
              </div>
              <Input
                placeholder="Pinterest URL"
                value={createFormData.pinterest}
                onChange={(e) => setCreateFormData({ ...createFormData, pinterest: e.target.value })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                Latitude and longitude fill automatically when address and postal code are set (Portugal lookup). You can still edit them manually.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Latitude"
                  value={createFormData.latitude}
                  onChange={(e) => setCreateFormData({ ...createFormData, latitude: e.target.value })}
                />
                <Input
                  placeholder="Longitude"
                  value={createFormData.longitude}
                  onChange={(e) => setCreateFormData({ ...createFormData, longitude: e.target.value })}
                />
              </div>
              <Textarea
                placeholder="Description"
                rows={3}
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Thumbnail</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                      });
                      setCreateThumbnail(base64);
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">{SALON_IMAGE_SIZE_HINTS.thumbnail}</p>
                  {createThumbnail && (
                    <img src={createThumbnail} alt="Thumbnail preview" className="h-24 w-full object-cover rounded border" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Logo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                      });
                      setCreateLogo(base64);
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">{SALON_IMAGE_SIZE_HINTS.logo}</p>
                  {createLogo && (
                    <img src={createLogo} alt="Logo preview" className="h-24 w-full object-contain rounded border bg-gray-50" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Banner</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                      });
                      setCreateBanner(base64);
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">{SALON_IMAGE_SIZE_HINTS.banner}</p>
                  {createBanner && (
                    <img src={createBanner} alt="Banner preview" className="h-24 w-full object-cover rounded border" />
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createFormData.isBioDiamond}
                  onChange={(e) => setCreateFormData({ ...createFormData, isBioDiamond: e.target.checked })}
                />
                <span className="text-sm">Bio Diamond</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSalon} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Salon"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                                <Diamond className="h-3 w-3" />
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
          onDelete={(id) => {
            // Keep the current selectedSalon, just close detail modal and show delete modal
            setShowDetailModal(false);
            setShowDeleteModal(true);
          }}
          onEdit={() => {
            setEditFormData({
              name: selectedSalon.name,
              address: selectedSalon.address,
              city: selectedSalon.city,
              postalCode: selectedSalon.postalCode,
              phone: selectedSalon.phone,
              email: selectedSalon.email,
              website: selectedSalon.website,
              instagram: selectedSalon.instagram ?? "",
              facebook: selectedSalon.facebook ?? "",
              pinterest: selectedSalon.pinterest ?? "",
              description: selectedSalon.description,
              latitude: selectedSalon.latitude,
              longitude: selectedSalon.longitude,
              image: selectedSalon.image,
              logo: selectedSalon.logo,
              images: selectedSalon.images || [],
              isBioDiamond: selectedSalon.isBioDiamond,
              isActive: selectedSalon.isActive,
            });
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
          onApprove={() => {
            setReviewAction("approve");
            setShowReviewModal(true);
          }}
          onReject={() => {
            setReviewAction("reject");
            setShowReviewModal(true);
          }}
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
            setShowDetailModal(true);
            // Don't clear selectedSalon or editFormData - keep them in case user wants to edit again
          }}
          onDelete={(id) => {
            // Keep the current selectedSalon, just close edit modal and show delete modal
            setShowEditModal(false);
            setEditFormData({});
            setShowDeleteModal(true);
          }}
          onImageDelete={(type, index) => {
            setImageToDelete({ type, index });
            setShowImageDeleteModal(true);
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

      {/* Delete Modal */}
      {showDeleteModal && selectedSalon && (
        <DeleteSalonModal
          salon={selectedSalon}
          onConfirm={() => handleDelete(selectedSalon.id)}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedSalon(null);
          }}
          isProcessing={isProcessing}
        />
      )}

      {/* Image Delete Modal */}
      {showImageDeleteModal && imageToDelete && (
        <DeleteImageModal
          imageType={imageToDelete.type}
          imageIndex={imageToDelete.index}
          onConfirm={() => {
            if (imageToDelete.type === 'main') {
              setEditFormData({ ...editFormData, image: null });
            } else if (imageToDelete.type === 'logo') {
              setEditFormData({ ...editFormData, logo: null });
            } else if (imageToDelete.type === 'gallery' && imageToDelete.index !== undefined) {
              const newImages = [...(editFormData.images || [])];
              newImages.splice(imageToDelete.index, 1);
              setEditFormData({ ...editFormData, images: newImages });
            }
            setShowImageDeleteModal(false);
            setImageToDelete(null);
          }}
          onCancel={() => {
            setShowImageDeleteModal(false);
            setImageToDelete(null);
          }}
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
  onEdit,
  onApprove,
  onReject,
}: {
  salon: Salon;
  onClose: () => void;
  formatWorkingHours: (hours: any) => string;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
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
                        alt="Thumbnail"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Thumbnail</p>
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
                        alt={`Banner ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Banner</p>
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
              {salon.instagram && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </h3>
                  <a
                    href={salon.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {salon.instagram}
                  </a>
                </div>
              )}
              {salon.facebook && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </h3>
                  <a
                    href={salon.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {salon.facebook}
                  </a>
                </div>
              )}
              {salon.pinterest && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pinterest
                  </h3>
                  <a
                    href={salon.pinterest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {salon.pinterest}
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
              {salon.status === "PENDING_REVIEW" && (
                <>
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700 border-green-300 flex items-center gap-2"
                    onClick={onApprove}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-300 flex items-center gap-2"
                    onClick={onReject}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  onDelete(salon.id);
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
  onDelete,
  onImageDelete,
  isProcessing,
}: {
  salon: Salon;
  formData: EditSalonForm;
  onFormDataChange: (data: EditSalonForm) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onImageDelete: (type: 'main' | 'logo' | 'gallery', index?: number) => void;
  isProcessing: boolean;
}) {
  const toBase64 = async (file: File) =>
    await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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
                  placeholder="https://..."
                  value={formData.website || ""}
                  onChange={(e) => onFormDataChange({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Social links are optional. They appear on the public salon page only when filled.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Instagram className="h-4 w-4 shrink-0" aria-hidden />
                  Instagram
                </label>
                <Input
                  placeholder="https://www.instagram.com/..."
                  value={formData.instagram ?? ""}
                  onChange={(e) => onFormDataChange({ ...formData, instagram: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Facebook className="h-4 w-4 shrink-0" aria-hidden />
                  Facebook
                </label>
                <Input
                  placeholder="https://www.facebook.com/..."
                  value={formData.facebook ?? ""}
                  onChange={(e) => onFormDataChange({ ...formData, facebook: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pinterest
              </label>
              <Input
                placeholder="https://www.pinterest.com/..."
                value={formData.pinterest ?? ""}
                onChange={(e) => onFormDataChange({ ...formData, pinterest: e.target.value })}
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Latitude and longitude fill automatically when address and postal code are set (Portugal lookup). You can still edit them manually.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={
                    formData.latitude === undefined ||
                    formData.latitude === null ||
                    Number.isNaN(Number(formData.latitude))
                      ? ""
                      : String(formData.latitude)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      onFormDataChange({ ...formData, latitude: undefined });
                      return;
                    }
                    const n = parseFloat(v);
                    if (Number.isFinite(n)) {
                      onFormDataChange({ ...formData, latitude: n });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={
                    formData.longitude === undefined ||
                    formData.longitude === null ||
                    Number.isNaN(Number(formData.longitude))
                      ? ""
                      : String(formData.longitude)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      onFormDataChange({ ...formData, longitude: undefined });
                      return;
                    }
                    const n = parseFloat(v);
                    if (Number.isFinite(n)) {
                      onFormDataChange({ ...formData, longitude: n });
                    }
                  }}
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

            {/* Images Management */}
            <div className="space-y-4">
              {/* Thumbnail (main listing image) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Thumbnail
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const base64 = await toBase64(file);
                    onFormDataChange({ ...formData, image: base64 });
                    e.currentTarget.value = "";
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">{SALON_IMAGE_SIZE_HINTS.thumbnail}</p>
                {formData.image && (
                  <div className="relative inline-block">
                    <img
                      src={formData.image}
                      alt="Thumbnail"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={() => onImageDelete('main')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const base64 = await toBase64(file);
                    onFormDataChange({ ...formData, logo: base64 });
                    e.currentTarget.value = "";
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">{SALON_IMAGE_SIZE_HINTS.logo}</p>
                {formData.logo && (
                  <div className="relative inline-block">
                    <img
                      src={formData.logo}
                      alt="Logo"
                      className="w-32 h-32 object-contain bg-gray-100 rounded-lg border border-gray-300 p-2"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={() => onImageDelete('logo')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Banner images */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Banner
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const newImages = await Promise.all(files.map((f) => toBase64(f)));
                    onFormDataChange({ ...formData, images: [...(formData.images || []), ...newImages] });
                    e.currentTarget.value = "";
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">{SALON_IMAGE_SIZE_HINTS.banner}</p>
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Banner ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => onImageDelete('gallery', idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(salon.id)}
                disabled={isProcessing}
              >
                Delete
              </Button>
              <div className="flex gap-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Delete Salon Modal Component
function DeleteSalonModal({
  salon,
  onConfirm,
  onCancel,
  isProcessing,
}: {
  salon: Salon;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Delete Salon
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete "{salon.name}"? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Salon"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Delete Image Modal Component
function DeleteImageModal({
  imageType,
  imageIndex,
  onConfirm,
  onCancel,
}: {
  imageType: 'main' | 'logo' | 'gallery';
  imageIndex?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const imageTypeLabels = {
    main: 'Thumbnail',
    logo: 'Logo',
    gallery: 'Banner',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Delete {imageTypeLabels[imageType]}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete this {imageTypeLabels[imageType].toLowerCase()}?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Image
            </Button>
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
