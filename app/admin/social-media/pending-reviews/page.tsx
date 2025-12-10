"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Clock,
  User,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SocialMediaPostModal } from "@/components/admin/social-media-post-modal";
import { SocialMediaPreviewModal } from "@/components/admin/social-media-preview-modal";
import { RejectionModal } from "@/components/admin/rejection-modal";
import { SocialMediaErrorBoundary } from "@/components/admin/social-media-error-boundary";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

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

export default function PendingReviewsPage() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<SocialMediaPost | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [reviewers, setReviewers] = useState<Record<string, { name: string | null; email: string }>>({});
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchAdminUsers();
  }, [filterPlatform]);

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

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("status", "PENDING_REVIEW");
      if (filterPlatform !== "all") {
        params.append("platform", filterPlatform);
      }

      const res = await fetch(`/api/social-media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.error || "Failed to fetch posts", "error");
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      toast("Failed to fetch posts. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (post?: SocialMediaPost) => {
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

  const handleOpenPreview = (post: SocialMediaPost) => {
    setPreviewPost(post);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewPost(null);
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
        toast(errorData.error || "Failed to delete post", "error");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast("Failed to delete post. Please try again.", "error");
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
        toast(errorData.error || "Failed to update post", "error");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast("Failed to update post. Please try again.", "error");
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

  const filteredPosts = posts.filter((post) => {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              Pending Reviews
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} awaiting review
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/social-media/calendar">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </Link>
          <Link href="/admin/social-media/list">
            <Button variant="outline">
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="TWITTER">Twitter</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                No pending reviews
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                All posts have been reviewed or there are no posts awaiting review.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => {
            const reviewer = post.assignedReviewerId ? reviewers[post.assignedReviewerId] : null;
            return (
              <Card key={post.id} className="border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {post.images.length > 0 && (
                      <div 
                        className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleOpenPreview(post)}
                      >
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
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                            Pending Review
                          </span>
                          {post.contentType && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {post.contentType}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {post.caption && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                          {post.caption}
                        </p>
                      )}
                      
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Scheduled: {formatDate(post.scheduledDate)}</span>
                        </div>
                        {reviewer && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Assigned to: {reviewer.name || reviewer.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Created: {formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(post.id, "APPROVED")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(post.id)}
                          className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label={`Reject post ${post.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(post.id, "DRAFT")}
                        >
                          Move to Draft
                        </Button>
                      </div>
                      
                      {post.reviewComments && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-gray-700 dark:text-gray-300 border border-yellow-200 dark:border-yellow-800">
                          <strong>Previous Review Comment:</strong> {post.reviewComments}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      <SocialMediaPostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingPost={editingPost}
        onSave={fetchPosts}
        adminUsers={adminUsers}
        isLoadingAdmins={isLoadingAdmins}
      />

      {/* Preview Modal */}
      <SocialMediaPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        post={previewPost}
        onStatusChange={handleStatusChange}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setRejectingPostId(null);
        }}
        onConfirm={handleRejectConfirm}
        postCaption={rejectingPostId ? posts.find((p) => p.id === rejectingPostId)?.caption : undefined}
      />
    </div>
    </SocialMediaErrorBoundary>
  );
}

