"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  List,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Mail,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { EmailCampaignModal } from "@/components/admin/email-campaign-modal";
import { RejectionModal } from "@/components/admin/rejection-modal";
import { toast, handleApiError } from "@/lib/utils";
import { Loader2 } from "lucide-react";

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

export default function PendingReviewsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [reviewers, setReviewers] = useState<Record<string, { name: string | null; email: string }>>({});
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectingCampaignId, setRejectingCampaignId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      setIsLoadingAdmins(true);
      const res = await fetch("/api/users?role=ADMIN");
      if (res.ok) {
        const users = await res.json();
        const usersMap = users.map((user: { id: string; name: string | null; email: string }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        }));
        setAdminUsers(usersMap);
        
        // Create a map for quick reviewer lookup
        const reviewerMap: Record<string, { name: string | null; email: string }> = {};
        usersMap.forEach((user: { id: string; name: string | null; email: string }) => {
          reviewerMap[user.id] = { name: user.name, email: user.email };
        });
        setReviewers(reviewerMap);
      } else {
        toast("Failed to load admin users", "error");
      }
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
      toast("Failed to load admin users", "error");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("status", "PENDING_REVIEW");

      const res = await fetch(`/api/email-campaigns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.error || "Failed to fetch campaigns", "error");
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast("Failed to fetch campaigns. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (campaign?: EmailCampaign) => {
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
        toast(errorData.error || "Failed to delete campaign", "error");
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast("Failed to delete campaign. Please try again.", "error");
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
        toast(errorData.error || "Failed to update campaign", "error");
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

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (searchQuery) {
      return (
        campaign.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

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
              Pending Reviews
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and approve email campaigns
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
          <Link href="/admin/email-campaigns/list">
            <Button variant="outline">
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No campaigns pending review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => {
            const reviewer = campaign.assignedReviewerId
              ? reviewers[campaign.assignedReviewerId]
              : null;

            return (
              <Card key={campaign.id} className="border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <CardTitle className="text-lg">{campaign.subject}</CardTitle>
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                          Pending Review
                        </span>
                      </div>
                      {reviewer && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <User className="h-4 w-4" />
                          <span>Assigned to: {reviewer.name || reviewer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaign.pdfUrl ? (
                      <div>
                        <h4 className="text-sm font-medium mb-2">PDF File:</h4>
                        <a
                          href={campaign.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                          <span>View PDF</span>
                        </a>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Content Preview:</h4>
                        <div
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm max-h-48 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: campaign.content }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Scheduled: {formatDate(campaign.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>
                          Recipients:{" "}
                          {campaign.recipientType === "ALL"
                            ? "All Users"
                            : campaign.recipientType === "SEGMENT"
                            ? "Segment"
                            : `${campaign.recipientList.length} custom`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Created: {formatDate(campaign.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, "APPROVED")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRejectClick(campaign.id)}
                        variant="outline"
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(campaign)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(campaign.id)}
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

