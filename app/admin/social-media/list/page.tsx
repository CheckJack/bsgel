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
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Square,
  CheckSquare,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SocialMediaPostModal } from "@/components/admin/social-media-post-modal";
import { RejectionModal } from "@/components/admin/rejection-modal";
import { SocialMediaErrorBoundary } from "@/components/admin/social-media-error-boundary";
import { toast, handleApiError, showLoadingToast } from "@/lib/utils";

type ContentType = "POST" | "STORY" | "REELS";

interface SocialMediaPost {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK" | "TWITTER" | "LINKEDIN" | "TIKTOK";
  caption: string;
  images: string[];
  scheduledDate: string;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
  reviewComments?: string;
  hashtags: string[];
  contentType?: ContentType;
  assignedReviewerId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SocialMediaListPage() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [allPosts, setAllPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [selectedMonth, filterStatus, filterPlatform]);

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

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("month", selectedMonth);
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      if (filterPlatform !== "all") {
        params.append("platform", filterPlatform);
      }

      const res = await fetch(`/api/social-media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllPosts(data);
        setCurrentPage(1); // Reset to first page when filters change
        setSelectedPosts(new Set()); // Clear selections
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      handleApiError(error, "load social media posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (post?: SocialMediaPost) => {
    fetchAdminUsers();
    if (post) {
      setEditingPost(post);
    } else {
      setEditingPost(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/social-media/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Post deleted successfully", "success");
        fetchPosts();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      handleApiError(error, "delete post");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPosts.size} post(s)?`)) return;

    setIsBulkActionLoading(true);
    const loadingToastId = showLoadingToast(`Deleting ${selectedPosts.size} post(s)...`);
    
    try {
      const deletePromises = Array.from(selectedPosts).map((id) =>
        fetch(`/api/social-media/${id}`, { method: "DELETE" })
      );
      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast(`Successfully deleted ${successCount} post(s)`, "success");
      }
      if (failCount > 0) {
        toast(`Failed to delete ${failCount} post(s)`, "error");
      }

      setSelectedPosts(new Set());
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete posts:", error);
      handleApiError(error, "delete posts");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: SocialMediaPost["status"]) => {
    if (selectedPosts.size === 0) return;

    setIsBulkActionLoading(true);
    const loadingToastId = showLoadingToast(`Updating ${selectedPosts.size} post(s) to ${newStatus}...`);
    
    try {
      const updatePromises = Array.from(selectedPosts).map((id) =>
        fetch(`/api/social-media/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      );
      const results = await Promise.allSettled(updatePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast(`Successfully updated ${successCount} post(s)`, "success");
      }
      if (failCount > 0) {
        toast(`Failed to update ${failCount} post(s)`, "error");
      }

      setSelectedPosts(new Set());
      fetchPosts();
    } catch (error) {
      console.error("Failed to update posts:", error);
      handleApiError(error, "update posts");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const handleStatusChange = async (
    postId: string,
    newStatus: SocialMediaPost["status"],
    comments?: string
  ) => {
    try {
      const payload: { status: SocialMediaPost["status"]; reviewComments?: string } = { status: newStatus };
      if (comments) {
        payload.reviewComments = comments;
      }

      const res = await fetch(`/api/social-media/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const statusMessages: Record<SocialMediaPost["status"], string> = {
          APPROVED: "Post approved successfully",
          REJECTED: "Post rejected",
          DRAFT: "Post moved to draft",
          PENDING_REVIEW: "Post submitted for review",
          PUBLISHED: "Post published",
        };
        toast(statusMessages[newStatus] || "Post updated successfully", "success");
        fetchPosts();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      handleApiError(error, "update post status");
    }
  };

  const handleRejectClick = (postId: string) => {
    setRejectingPostId(postId);
    setIsRejectionModalOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingPostId) return;
    await handleStatusChange(rejectingPostId, "REJECTED", reason);
    setIsRejectionModalOpen(false);
    setRejectingPostId(null);
  };

  const getStatusBadge = (status: SocialMediaPost["status"]) => {
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
      PUBLISHED: (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
          Published
        </span>
      ),
    };
    return badges[status];
  };

  const getPlatformIcon = (platform: SocialMediaPost["platform"]) => {
    const icons = {
      INSTAGRAM: <Instagram className="h-4 w-4" />,
      FACEBOOK: <Facebook className="h-4 w-4" />,
      TWITTER: <Twitter className="h-4 w-4" />,
      LINKEDIN: <Linkedin className="h-4 w-4" />,
      TIKTOK: <span className="text-xs font-bold">TT</span>,
    };
    return icons[platform];
  };

  const filteredPosts = allPosts.filter((post) => {
    if (searchQuery) {
      return (
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const formatDate = (dateString: string) => {
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
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading posts">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden="true" />
        <span className="sr-only">Loading posts...</span>
      </div>
    );
  }

  return (
    <SocialMediaErrorBoundary>
      <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/social-media">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Social Media List
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View all posts in a detailed list format
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/social-media/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </Link>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedPosts.size} post(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange("APPROVED")}
                    disabled={isBulkActionLoading}
                    aria-label="Approve selected posts"
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
                    aria-label="Move selected posts to draft"
                  >
                    Move to Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={isBulkActionLoading}
                    className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Delete selected posts"
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
                onClick={() => setSelectedPosts(new Set())}
                aria-label="Clear selection"
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
                <Search className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  aria-label="Search posts by caption or hashtags"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Published</option>
              </select>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-label="Filter by platform"
              >
                <option value="all">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="TWITTER">Twitter</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="TIKTOK">TikTok</option>
              </select>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-label="Filter by month"
              />
              <div className="flex items-center gap-2">
                <label htmlFor="page-size" className="text-sm text-gray-600 dark:text-gray-400">
                  Per page:
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  aria-label="Posts per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      <div className="space-y-4">
        {paginatedPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {filteredPosts.length === 0
                  ? "No posts found. Create your first post!"
                  : "No posts on this page."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedPosts.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    aria-label={selectedPosts.size === paginatedPosts.length ? "Deselect all" : "Select all"}
                  >
                    {selectedPosts.size === paginatedPosts.length &&
                    paginatedPosts.every((p) => selectedPosts.has(p.id)) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredPosts.length)} of {filteredPosts.length} posts
                  </span>
                </div>
              </div>
            )}
            {paginatedPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => togglePostSelection(post.id)}
                    className="flex-shrink-0 mt-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    aria-label={selectedPosts.has(post.id) ? "Deselect post" : "Select post"}
                  >
                    {selectedPosts.has(post.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {post.images.length > 0 && (
                    <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={post.images[0]}
                        alt="Post image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <span className="font-semibold">
                          {post.platform.replace("_", " ")}
                        </span>
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(post)}
                          aria-label={`Edit post ${post.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          aria-label={`Delete post ${post.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                      {post.caption}
                    </p>
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.hashtags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-blue-600 dark:text-blue-400"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.hashtags.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{post.hashtags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(post.scheduledDate)}</span>
                    </div>
                    {post.status === "PENDING_REVIEW" && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(post.id, "APPROVED")
                          }
                          aria-label={`Approve post ${post.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(post.id)}
                          aria-label={`Reject post ${post.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {post.reviewComments && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-gray-700 dark:text-gray-300">
                        <strong>Review:</strong> {post.reviewComments}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modals */}
      <SocialMediaPostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingPost={editingPost}
        onSave={fetchPosts}
        adminUsers={adminUsers}
        isLoadingAdmins={isLoadingAdmins}
      />

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setRejectingPostId(null);
        }}
        onConfirm={handleRejectConfirm}
        postCaption={rejectingPostId ? paginatedPosts.find((p) => p.id === rejectingPostId)?.caption : undefined}
      />
    </div>
    </SocialMediaErrorBoundary>
  );
}

