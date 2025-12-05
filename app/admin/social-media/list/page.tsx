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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SocialMediaPostModal } from "@/components/admin/social-media-post-modal";

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

  useEffect(() => {
    fetchPosts();
  }, [selectedMonth, filterStatus, filterPlatform]);

  const fetchAdminUsers = async () => {
    try {
      setIsLoadingAdmins(true);
      const res = await fetch("/api/users?role=ADMIN");
      if (res.ok) {
        const users = await res.json();
        setAdminUsers(users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
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
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
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
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleStatusChange = async (
    postId: string,
    newStatus: SocialMediaPost["status"],
    comments?: string
  ) => {
    try {
      const payload: any = { status: newStatus };
      if (comments) {
        payload.reviewComments = comments;
      }

      const res = await fetch(`/api/social-media/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No posts found. Create your first post!
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
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
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const comments = prompt("Rejection reason:");
                            if (comments) {
                              handleStatusChange(post.id, "REJECTED", comments);
                            }
                          }}
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
          ))
        )}
      </div>

      {/* Modal */}
      <SocialMediaPostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingPost={editingPost}
        onSave={fetchPosts}
        adminUsers={adminUsers}
        isLoadingAdmins={isLoadingAdmins}
      />
    </div>
  );
}

