"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, List, Plus, Mail, Clock, CheckCircle2, XCircle, AlertCircle, Send } from "lucide-react";
import Link from "next/link";

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

export default function EmailCampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/email-campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: campaigns.length,
    drafts: campaigns.filter((c) => c.status === "DRAFT").length,
    pendingReview: campaigns.filter((c) => c.status === "PENDING_REVIEW").length,
    approved: campaigns.filter((c) => c.status === "APPROVED").length,
    scheduled: campaigns.filter((c) => c.status === "SCHEDULED").length,
    sent: campaigns.filter((c) => c.status === "SENT").length,
    rejected: campaigns.filter((c) => c.status === "REJECTED").length,
    upcoming: campaigns.filter((c) => {
      if (!c.scheduledDate) return false;
      const scheduledDate = new Date(c.scheduledDate);
      return scheduledDate > new Date() && c.status !== "SENT";
    }).length,
  };

  // Get upcoming campaigns (next 7 days)
  const upcomingCampaigns = campaigns
    .filter((c) => {
      if (!c.scheduledDate) return false;
      const scheduledDate = new Date(c.scheduledDate);
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      return scheduledDate >= now && scheduledDate <= sevenDaysFromNow && c.status !== "SENT";
    })
    .sort((a, b) => {
      const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
      const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Email Campaigns Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your email campaigns and scheduling
          </p>
        </div>
        <Link href="/admin/email-campaigns/calendar">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendingReview}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.sent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.upcoming}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Draft
                  </span>
                </div>
                <span className="font-semibold">{stats.drafts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                    Pending Review
                  </span>
                </div>
                <span className="font-semibold">{stats.pendingReview}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    Approved
                  </span>
                </div>
                <span className="font-semibold">{stats.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Scheduled
                  </span>
                </div>
                <span className="font-semibold">{stats.scheduled}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Sent
                  </span>
                </div>
                <span className="font-semibold">{stats.sent}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                    Rejected
                  </span>
                </div>
                <span className="font-semibold">{stats.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipient Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span>All Users</span>
                </div>
                <span className="font-semibold">
                  {campaigns.filter((c) => c.recipientType === "ALL").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span>Segment</span>
                </div>
                <span className="font-semibold">
                  {campaigns.filter((c) => c.recipientType === "SEGMENT").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span>Custom List</span>
                </div>
                <span className="font-semibold">
                  {campaigns.filter((c) => c.recipientType === "CUSTOM").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Link href="/admin/email-campaigns/pending-reviews">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <CardTitle>Pending Reviews</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stats.pendingReview} {stats.pendingReview === 1 ? 'campaign' : 'campaigns'} awaiting review
                  </p>
                </div>
                {stats.pendingReview > 0 && (
                  <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-semibold">
                    {stats.pendingReview}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/email-campaigns/rejected">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <CardTitle>Rejected Campaigns</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stats.rejected} {stats.rejected === 1 ? 'campaign' : 'campaigns'} rejected
                  </p>
                </div>
                {stats.rejected > 0 && (
                  <div className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold">
                    {stats.rejected}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/email-campaigns/calendar">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Calendar View</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View and manage campaigns in calendar format
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/email-campaigns/list">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <List className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>List View</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View all campaigns in a detailed list format
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Upcoming Campaigns */}
      {upcomingCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Campaigns (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-sm">
                        {campaign.subject}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {campaign.scheduledDate && new Date(campaign.scheduledDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === "PENDING_REVIEW" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                        Pending Review
                      </span>
                    )}
                    {campaign.status === "APPROVED" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                        Approved
                      </span>
                    )}
                    {campaign.status === "SCHEDULED" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Scheduled
                      </span>
                    )}
                    {campaign.status === "DRAFT" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

