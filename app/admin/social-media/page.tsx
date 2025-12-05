"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, List, Plus, Instagram, Facebook, Twitter, Linkedin, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SocialMediaPost {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "TWITTER" | "LINKEDIN" | "TIKTOK";
  caption: string;
  images: string[];
  scheduledDate: string;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
  reviewComments?: string;
  hashtags: string[];
  contentType?: "POST" | "STORY" | "REELS";
  assignedReviewerId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SocialMediaDashboard() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/social-media");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: posts.length,
    drafts: posts.filter((p) => p.status === "DRAFT").length,
    pendingReview: posts.filter((p) => p.status === "PENDING_REVIEW").length,
    approved: posts.filter((p) => p.status === "APPROVED").length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    rejected: posts.filter((p) => p.status === "REJECTED").length,
    upcoming: posts.filter((p) => {
      const scheduledDate = new Date(p.scheduledDate);
      return scheduledDate > new Date() && p.status !== "PUBLISHED";
    }).length,
  };

  const platformStats = {
    INSTAGRAM: posts.filter((p) => p.platform === "INSTAGRAM").length,
    FACEBOOK: posts.filter((p) => p.platform === "FACEBOOK").length,
    TWITTER: posts.filter((p) => p.platform === "TWITTER").length,
    LINKEDIN: posts.filter((p) => p.platform === "LINKEDIN").length,
    TIKTOK: posts.filter((p) => p.platform === "TIKTOK").length,
  };

  const getPlatformIcon = (platform: SocialMediaPost["platform"]) => {
    const icons = {
      INSTAGRAM: <Instagram className="h-5 w-5" />,
      FACEBOOK: <Facebook className="h-5 w-5" />,
      TWITTER: <Twitter className="h-5 w-5" />,
      LINKEDIN: <Linkedin className="h-5 w-5" />,
      TIKTOK: <span className="text-xs font-bold">TT</span>,
    };
    return icons[platform];
  };

  // Get upcoming posts (next 7 days)
  const upcomingPosts = posts
    .filter((p) => {
      const scheduledDate = new Date(p.scheduledDate);
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      return scheduledDate >= now && scheduledDate <= sevenDaysFromNow && p.status !== "PUBLISHED";
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
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
            Social Media Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your social media content and scheduling
          </p>
        </div>
        <Link href="/admin/social-media/calendar">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Posts
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
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.published}
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
                    Published
                  </span>
                </div>
                <span className="font-semibold">{stats.published}</span>
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
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(platformStats).map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform as SocialMediaPost["platform"])}
                    <span className="capitalize">
                      {platform === "INSTAGRAM"
                        ? "Instagram"
                        : platform === "FACEBOOK"
                        ? "Facebook"
                        : platform === "TWITTER"
                        ? "Twitter"
                        : platform === "LINKEDIN"
                        ? "LinkedIn"
                        : "TikTok"}
                    </span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Link href="/admin/social-media/pending-reviews">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <CardTitle>Pending Reviews</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stats.pendingReview} {stats.pendingReview === 1 ? 'post' : 'posts'} awaiting review
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

        <Link href="/admin/social-media/rejected">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <CardTitle>Rejected Posts</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stats.rejected} {stats.rejected === 1 ? 'post' : 'posts'} rejected
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

        <Link href="/admin/social-media/calendar">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Calendar View</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View and manage posts in calendar format
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/social-media/list">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <List className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>List View</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View all posts in a detailed list format
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Upcoming Posts */}
      {upcomingPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Posts (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(post.platform)}
                    <div>
                      <div className="font-medium text-sm">
                        {post.caption.substring(0, 50)}
                        {post.caption.length > 50 ? "..." : ""}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.scheduledDate).toLocaleDateString("en-US", {
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
                    {post.status === "PENDING_REVIEW" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                        Pending Review
                      </span>
                    )}
                    {post.status === "APPROVED" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                        Approved
                      </span>
                    )}
                    {post.status === "DRAFT" && (
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
