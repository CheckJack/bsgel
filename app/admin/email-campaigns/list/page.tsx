"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Plus,
  Calendar,
  List,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Square,
  CheckSquare,
  Mail,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { EmailCampaignModal } from "@/components/admin/email-campaign-modal";
import { RejectionModal } from "@/components/admin/rejection-modal";
import { toast, handleApiError, showLoadingToast } from "@/lib/utils";

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  pdfUrl?: string | null;
  scheduledDate: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SCHEDULED" | "SENT";
  reviewComments?: string;
  assignedReviewerId?: string;
  recipientList: string[];
  recipientType: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailCampaignsListPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectingCampaignId, setRejectingCampaignId] = useState<string | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedMonth, filterStatus]);

  const fetchAdminUsers = async () => {
    try {
      setIsLoadingAdmins(true);
      const res = await fetch("/api/users?role=ADMIN");
      if (res.ok) {
        const users = await res.json();
        setAdminUsers(users.map((user: { id: string; name: string | null; email: string }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })));
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
      handleApiError(error, "load admin users");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("month", selectedMonth);
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }

      const res = await fetch(`/api/email-campaigns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllCampaigns(data);
        setCurrentPage(1);
        setSelectedCampaigns(new Set());
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      handleApiError(error, "load email campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (campaign?: EmailCampaign) => {
    fetchAdminUsers();
    if (campaign) {
      setEditingCampaign(campaign);
    } else {
      setEditingCampaign(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const res = await fetch(`/api/email-campaigns/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Campaign deleted successfully", "success");
        fetchCampaigns();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      handleApiError(error, "delete campaign");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCampaigns.size} campaign(s)?`)) return;

    setIsBulkActionLoading(true);
    const loadingToastId = showLoadingToast(`Deleting ${selectedCampaigns.size} campaign(s)...`);
    
    try {
      const deletePromises = Array.from(selectedCampaigns).map((id) =>
        fetch(`/api/email-campaigns/${id}`, { method: "DELETE" })
      );
      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast(`Successfully deleted ${successCount} campaign(s)`, "success");
      }
      if (failCount > 0) {
        toast(`Failed to delete ${failCount} campaign(s)`, "error");
      }

      setSelectedCampaigns(new Set());
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to delete campaigns:", error);
      handleApiError(error, "delete campaigns");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: EmailCampaign["status"]) => {
    if (selectedCampaigns.size === 0) return;

    setIsBulkActionLoading(true);
    const loadingToastId = showLoadingToast(`Updating ${selectedCampaigns.size} campaign(s) to ${newStatus}...`);
    
    try {
      const updatePromises = Array.from(selectedCampaigns).map((id) =>
        fetch(`/api/email-campaigns/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      );
      const results = await Promise.allSettled(updatePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast(`Successfully updated ${successCount} campaign(s)`, "success");
      }
      if (failCount > 0) {
        toast(`Failed to update ${failCount} campaign(s)`, "error");
      }

      setSelectedCampaigns(new Set());
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to update campaigns:", error);
      handleApiError(error, "update campaigns");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCampaigns.size === filteredCampaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(filteredCampaigns.map((c) => c.id)));
    }
  };

  const handleStatusChange = async (
    campaignId: string,
    newStatus: EmailCampaign["status"],
    comments?: string
  ) => {
    try {
      const payload: { status: EmailCampaign["status"]; reviewComments?: string } = { status: newStatus };
      if (comments) {
        payload.reviewComments = comments;
      }

      const res = await fetch(`/api/email-campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const statusMessages: Record<EmailCampaign["status"], string> = {
          APPROVED: "Campaign approved successfully",
          REJECTED: "Campaign rejected",
          DRAFT: "Campaign moved to draft",
          PENDING_REVIEW: "Campaign submitted for review",
          SCHEDULED: "Campaign scheduled",
          SENT: "Campaign sent",
        };
        toast(statusMessages[newStatus] || "Campaign updated successfully", "success");
        fetchCampaigns();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      handleApiError(error, "update campaign status");
    }
  };

  const handleRejectClick = (campaignId: string) => {
    setRejectingCampaignId(campaignId);
    setIsRejectionModalOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingCampaignId) return;
    await handleStatusChange(rejectingCampaignId, "REJECTED", reason);
    setIsRejectionModalOpen(false);
    setRejectingCampaignId(null);
  };

  const getStatusBadge = (status: EmailCampaign["status"]) => {
    const badges = {
      DRAFT: (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          Draft
        </span>
      ),
      PENDING_REVIEW: (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
          Pending Review
        </span>
      ),
      APPROVED: (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
          Approved
        </span>
      ),
      REJECTED: (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
          Rejected
        </span>
      ),
      SCHEDULED: (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
          Scheduled
        </span>
      ),
      SENT: (
        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
          Sent
        </span>
      ),
    };
    return badges[status];
  };

  const filteredCampaigns = allCampaigns.filter((campaign) => {
    if (searchQuery) {
      return (
        campaign.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/email-campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Email Campaigns List
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View all campaigns in a detailed list format
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/email-campaigns/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </Link>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.size > 0 && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedCampaigns.size} campaign(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange("APPROVED")}
                    disabled={isBulkActionLoading}
                  >
                    {isBulkActionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange("DRAFT")}
                    disabled={isBulkActionLoading}
                  >
                    Move to Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={isBulkActionLoading}
                    className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {isBulkActionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCampaigns(new Set())}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="SENT">Sent</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center"
                    >
                      {selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recipients
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Scheduled
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No campaigns found
                    </td>
                  </tr>
                ) : (
                  paginatedCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCampaignSelection(campaign.id)}
                          className="flex items-center"
                        >
                          {selectedCampaigns.has(campaign.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {campaign.subject}
                          {campaign.pdfUrl && (
                            <div title="Has PDF attachment">
                              <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {campaign.pdfUrl ? "PDF file attached" : campaign.content.replace(/<[^>]*>/g, "").substring(0, 50) + "..."}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(campaign.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>
                            {campaign.recipientType === "ALL"
                              ? "All Users"
                              : campaign.recipientType === "SEGMENT"
                              ? "Segment"
                              : `${campaign.recipientList.length} custom`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(campaign.scheduledDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === "PENDING_REVIEW" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(campaign.id, "APPROVED")}
                                className="border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectClick(campaign.id)}
                                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(campaign)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(campaign.id)}
                            className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <EmailCampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingCampaign={editingCampaign}
        onSave={fetchCampaigns}
        adminUsers={adminUsers}
        isLoadingAdmins={isLoadingAdmins}
      />

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setRejectingCampaignId(null);
        }}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}

