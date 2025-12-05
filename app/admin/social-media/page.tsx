"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Calendar,
  List,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  X,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

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

type ViewMode = "calendar" | "list";

export default function AdminSocialMediaPage() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    platform: "INSTAGRAM" as SocialMediaPost["platform"],
    contentType: "POST" as ContentType,
    caption: "",
    images: [] as string[],
    scheduledDate: "",
    scheduledTime: "",
    status: "DRAFT" as SocialMediaPost["status"],
    hashtags: [] as string[],
    hashtagInput: "",
    reviewComments: "",
    assignedReviewerId: "" as string | undefined,
  });

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

  useEffect(() => {
    // Reset preview image index when images change
    if (formData.images.length > 0 && previewImageIndex >= formData.images.length) {
      setPreviewImageIndex(0);
    }
    
    // Update image dimensions when preview image changes
    if (formData.images.length > 0 && formData.contentType === "POST") {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = formData.images[previewImageIndex];
    }
  }, [formData.images, previewImageIndex, formData.contentType]);

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
    // Fetch admin users when modal opens
    fetchAdminUsers();

    if (post) {
      setEditingPost(post);
      const scheduledDate = new Date(post.scheduledDate);
      setFormData({
        platform: post.platform,
        contentType: post.contentType || "POST",
        caption: post.caption,
        images: post.images,
        scheduledDate: scheduledDate.toISOString().slice(0, 10),
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        status: post.status,
        hashtags: post.hashtags,
        hashtagInput: "",
        reviewComments: post.reviewComments || "",
        assignedReviewerId: post.assignedReviewerId || "",
      });
      setPreviewImageIndex(0);
      
      // Load image dimensions if images exist
      if (post.images && post.images.length > 0) {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = post.images[0];
      } else {
        setImageDimensions(null);
      }
    } else {
      setEditingPost(null);
      const now = new Date();
      setFormData({
        platform: "INSTAGRAM",
        contentType: "POST",
        caption: "",
        images: [],
        scheduledDate: now.toISOString().slice(0, 10),
        scheduledTime: now.toTimeString().slice(0, 5),
        status: "DRAFT",
        hashtags: [],
        hashtagInput: "",
        reviewComments: "",
        assignedReviewerId: "",
      });
      setPreviewImageIndex(0);
      setImageDimensions(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleAddHashtag = () => {
    if (formData.hashtagInput.trim()) {
      const hashtag = formData.hashtagInput.trim().startsWith("#")
        ? formData.hashtagInput.trim()
        : `#${formData.hashtagInput.trim()}`;
      setFormData({
        ...formData,
        hashtags: [...formData.hashtags, hashtag],
        hashtagInput: "",
      });
    }
  };

  const handleRemoveHashtag = (index: number) => {
    setFormData({
      ...formData,
      hashtags: formData.hashtags.filter((_, i) => i !== index),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you'd upload to a storage service
      // For now, we'll use FileReader to create data URLs
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setFormData({
            ...formData,
            images: [...formData.images, dataUrl],
          });
          
          // Get image dimensions
          if (index === 0) {
            const img = new window.Image();
            img.onload = () => {
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = dataUrl;
          }
        };
        reader.readAsDataURL(file);
      });
      setPreviewImageIndex(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: newImages,
    });
    
    // Reset dimensions if removing the first image
    if (index === 0 && newImages.length > 0) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = newImages[0];
    } else if (newImages.length === 0) {
      setImageDimensions(null);
    }
    
    if (previewImageIndex >= newImages.length && newImages.length > 0) {
      setPreviewImageIndex(newImages.length - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const scheduledDateTime = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime}`
      );

      // Validate reviewer assignment for PENDING_REVIEW status
      if (formData.status === "PENDING_REVIEW" && !formData.assignedReviewerId) {
        setError("Please select a reviewer when status is set to Pending Review.");
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        platform: formData.platform,
        contentType: formData.contentType,
        caption: formData.contentType === "STORY" ? "" : formData.caption, // Stories don't have captions
        images: formData.images,
        scheduledDate: scheduledDateTime.toISOString(),
        status: formData.status,
        hashtags: formData.hashtags,
      };

      // Include assignedReviewerId if status is PENDING_REVIEW
      if (formData.status === "PENDING_REVIEW" && formData.assignedReviewerId) {
        payload.assignedReviewerId = formData.assignedReviewerId;
      }

      // Include reviewComments for editing
      if (editingPost && formData.reviewComments) {
        payload.reviewComments = formData.reviewComments;
      }

      const url = editingPost
        ? `/api/social-media/${editingPost.id}`
        : "/api/social-media";
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        fetchPosts();
        handleCloseModal();
      } else {
        let errorMessage = data.error || "Failed to save post. Please check the browser console for details.";
        
        // Special handling for database setup errors
        if (data.code === "TABLE_NOT_FOUND") {
          errorMessage = `Database setup required: ${data.details || data.error}\n\nPlease run: npx prisma migrate dev --name add_social_media_posts\n\n⚠️ NEVER use "db push" - it can delete all your data!`;
        } else if (data.details) {
          errorMessage = `${data.error}\n\nDetails: ${data.details}`;
        }
        
        setError(errorMessage);
        console.error("API Error:", data);
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      setError("Failed to save post. Please check if the database migration has been run. Run: npx prisma migrate dev --name add_social_media_posts\n\n⚠️ NEVER use \"db push\" - it can delete all your data!");
    } finally {
      setIsSubmitting(false);
    }
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

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getPostsForDate = (day: number | null) => {
    if (day === null) return [];
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return filteredPosts.filter((post) => {
      const postDate = new Date(post.scheduledDate);
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === month - 1 &&
        postDate.getFullYear() === year
      );
    });
  };

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

  const currentMonthDate = new Date(
    parseInt(selectedMonth.split("-")[0]),
    parseInt(selectedMonth.split("-")[1]) - 1
  );

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
            Social Media
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and review your Instagram posts
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters and View Toggle */}
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
            <div className="flex gap-2">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentMonthDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const [year, month] = selectedMonth.split("-").map(Number);
                    const prevMonth = new Date(year, month - 2, 1);
                    setSelectedMonth(
                      `${prevMonth.getFullYear()}-${String(
                        prevMonth.getMonth() + 1
                      ).padStart(2, "0")}`
                    );
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const [year, month] = selectedMonth.split("-").map(Number);
                    const nextMonth = new Date(year, month, 1);
                    setSelectedMonth(
                      `${nextMonth.getFullYear()}-${String(
                        nextMonth.getMonth() + 1
                      ).padStart(2, "0")}`
                    );
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2"
                  >
                    {day}
                  </div>
                )
              )}
              {getDaysInMonth(currentMonthDate).map((day, index) => {
                const dayPosts = getPostsForDate(day);
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border border-gray-200 dark:border-gray-700 rounded-lg p-2 ${
                      day === null ? "bg-gray-50 dark:bg-gray-900" : ""
                    }`}
                  >
                    {day && (
                      <>
                        <div className="font-semibold text-sm mb-1">{day}</div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 2).map((post) => (
                            <div
                              key={post.id}
                              className="text-xs p-1 rounded bg-blue-50 dark:bg-blue-900/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              onClick={() => handleOpenModal(post)}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                {getPlatformIcon(post.platform)}
                                {getStatusBadge(post.status)}
                              </div>
                              <div className="truncate text-gray-700 dark:text-gray-300">
                                {post.caption.substring(0, 30)}...
                              </div>
                            </div>
                          ))}
                          {dayPosts.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{dayPosts.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
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
      )}

      {/* Create/Edit Modal - Full Screen */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingPost ? "Edit Post" : "Create New Post"}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Form Section */}
            <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-6 lg:p-8">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value as SocialMediaPost["platform"],
                      })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TWITTER">Twitter</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="TIKTOK">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Content Type
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentType: e.target.value as ContentType,
                      })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="POST">Post</option>
                    <option value="STORY">Story</option>
                    <option value="REELS">Reels</option>
                  </select>
                </div>

                {formData.contentType !== "STORY" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Caption
                    </label>
                    <Textarea
                      value={formData.caption}
                      onChange={(e) =>
                        setFormData({ ...formData, caption: e.target.value })
                      }
                      rows={4}
                      placeholder="Write your post caption..."
                      required={formData.contentType === "POST"}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <Image
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            width={100}
                            height={100}
                            className="rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Scheduled Date
                    </label>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduledDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Scheduled Time
                    </label>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduledTime: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as SocialMediaPost["status"];
                      setFormData({
                        ...formData,
                        status: newStatus,
                        // Clear assigned reviewer if status is not PENDING_REVIEW
                        assignedReviewerId: newStatus === "PENDING_REVIEW" ? formData.assignedReviewerId : "",
                      });
                    }}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>

                {formData.status === "PENDING_REVIEW" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Assign Reviewer <span className="text-red-500">*</span>
                    </label>
                    {isLoadingAdmins ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading reviewers...</div>
                    ) : (
                      <select
                        value={formData.assignedReviewerId || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            assignedReviewerId: e.target.value || undefined,
                          })
                        }
                        className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        required
                      >
                        <option value="">Select a reviewer...</option>
                        {adminUsers.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name || admin.email}
                          </option>
                        ))}
                      </select>
                    )}
                    {adminUsers.length === 0 && !isLoadingAdmins && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        No admin users found. Please create admin users first.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hashtags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={formData.hashtagInput}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hashtagInput: e.target.value,
                        })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddHashtag();
                        }
                      }}
                      placeholder="Add hashtag..."
                    />
                    <Button
                      type="button"
                      onClick={handleAddHashtag}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  {formData.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveHashtag(idx)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {editingPost && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Review Comments
                    </label>
                    <Textarea
                      value={formData.reviewComments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reviewComments: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Add review comments..."
                    />
                  </div>
                )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
                    </Button>
                  </div>
                </form>
              </div>

            {/* Preview Section */}
            <div className="w-full lg:w-1/2 bg-gray-50 dark:bg-gray-900 p-6 lg:p-8 overflow-y-auto flex items-center justify-center">
                <div className="w-full flex justify-center">
                  {(() => {
                    // Calculate dynamic size for POST based on image dimensions
                    let phoneWidth = 416;
                    let screenWidth = 400;
                    let screenHeight = 700;
                    
                    if (formData.contentType === "POST" && imageDimensions && formData.images.length > 0) {
                      const aspectRatio = imageDimensions.width / imageDimensions.height;
                      const maxWidth = 900; // Maximum width for the preview (increased for full screen)
                      const maxHeight = 1000; // Maximum height for the preview (increased for full screen)
                      const minSize = 300; // Minimum size (increased)
                      
                      // Scale factor to fit image in preview (scale down large images, keep small ones readable)
                      const scaleFactor = 0.8; // Increased from 0.6 to make images bigger
                      
                      // Calculate dimensions that fit the image while respecting max constraints
                      let calculatedWidth = imageDimensions.width * scaleFactor;
                      let calculatedHeight = imageDimensions.height * scaleFactor;
                      
                      // Ensure we don't exceed max dimensions
                      if (calculatedWidth > maxWidth) {
                        const scale = maxWidth / calculatedWidth;
                        calculatedWidth = maxWidth;
                        calculatedHeight = calculatedHeight * scale;
                      }
                      
                      if (calculatedHeight > maxHeight) {
                        const scale = maxHeight / calculatedHeight;
                        calculatedHeight = maxHeight;
                        calculatedWidth = calculatedWidth * scale;
                      }
                      
                      // Ensure minimum sizes
                      if (aspectRatio > 1) {
                        // Landscape: ensure minimum width
                        if (calculatedWidth < minSize) {
                          calculatedWidth = minSize;
                          calculatedHeight = calculatedWidth / aspectRatio;
                        }
                      } else if (aspectRatio < 1) {
                        // Portrait: ensure minimum height
                        if (calculatedHeight < minSize) {
                          calculatedHeight = minSize;
                          calculatedWidth = calculatedHeight * aspectRatio;
                        }
                      } else {
                        // Square: ensure minimum size
                        if (calculatedWidth < minSize) {
                          calculatedWidth = minSize;
                          calculatedHeight = minSize;
                        }
                      }
                      
                      screenWidth = calculatedWidth;
                      screenHeight = calculatedHeight;
                      
                      // Add padding for phone frame
                      phoneWidth = screenWidth + 16;
                    } else if (formData.contentType === "POST") {
                      // Default square for POST when no image (bigger for full screen)
                      screenWidth = 400;
                      screenHeight = 400;
                      phoneWidth = 416;
                    } else {
                      // Stories and Reels - bigger for full screen
                      screenWidth = 400;
                      screenHeight = 700;
                      phoneWidth = 416;
                    }
                    
                    return (
                      <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: `${phoneWidth}px` }}>
                        {/* Phone Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                        
                        {/* Phone Screen - Adapts based on content type and image dimensions */}
                        <div 
                          className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative"
                          style={{ width: `${screenWidth}px`, height: `${screenHeight}px` }}
                        >
                      {/* POST Format */}
                      {formData.contentType === "POST" && (
                        <div className="bg-white dark:bg-gray-800 h-full w-full flex flex-col">
                          {/* Profile Header */}
                          <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                              BS
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs truncate">
                                Bio Sculpture
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                {formData.scheduledDate && formData.scheduledTime
                                  ? new Date(
                                      `${formData.scheduledDate}T${formData.scheduledTime}`
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Now"}
                              </div>
                            </div>
                          </div>

                          {/* Images - Adapts to image dimensions */}
                          {formData.images.length > 0 ? (
                            <div className="relative flex-1 min-h-0">
                              <div 
                                className="relative w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center cursor-grab active:cursor-grabbing"
                                onTouchStart={(e) => {
                                  setTouchStart(e.targetTouches[0].clientX);
                                }}
                                onTouchMove={(e) => {
                                  setTouchEnd(e.targetTouches[0].clientX);
                                }}
                                onTouchEnd={() => {
                                  if (!touchStart || !touchEnd) return;
                                  
                                  const distance = touchStart - touchEnd;
                                  const minSwipeDistance = 50;
                                  
                                  if (distance > minSwipeDistance) {
                                    // Swipe left - next image
                                    setPreviewImageIndex(
                                      (prev) => (prev + 1) % formData.images.length
                                    );
                                  } else if (distance < -minSwipeDistance) {
                                    // Swipe right - previous image
                                    setPreviewImageIndex(
                                      (prev) =>
                                        (prev - 1 + formData.images.length) %
                                        formData.images.length
                                    );
                                  }
                                  
                                  setTouchStart(null);
                                  setTouchEnd(null);
                                }}
                                onMouseDown={(e) => {
                                  setTouchStart(e.clientX);
                                }}
                                onMouseMove={(e) => {
                                  if (touchStart !== null) {
                                    setTouchEnd(e.clientX);
                                  }
                                }}
                                onMouseUp={() => {
                                  if (touchStart !== null && touchEnd !== null) {
                                    const distance = touchStart - touchEnd;
                                    const minSwipeDistance = 50;
                                    
                                    if (distance > minSwipeDistance) {
                                      // Swipe left - next image
                                      setPreviewImageIndex(
                                        (prev) => (prev + 1) % formData.images.length
                                      );
                                    } else if (distance < -minSwipeDistance) {
                                      // Swipe right - previous image
                                      setPreviewImageIndex(
                                        (prev) =>
                                          (prev - 1 + formData.images.length) %
                                          formData.images.length
                                      );
                                    }
                                  }
                                  
                                  setTouchStart(null);
                                  setTouchEnd(null);
                                }}
                                onMouseLeave={() => {
                                  setTouchStart(null);
                                  setTouchEnd(null);
                                }}
                              >
                                <Image
                                  src={formData.images[previewImageIndex]}
                                  alt="Post preview"
                                  fill
                                  className="object-contain select-none"
                                  draggable={false}
                                />
                                {formData.images.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImageIndex(
                                          (prev) =>
                                            (prev - 1 + formData.images.length) %
                                            formData.images.length
                                        )
                                      }
                                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                                    >
                                      <ChevronLeft className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewImageIndex(
                                          (prev) =>
                                            (prev + 1) % formData.images.length
                                        )
                                      }
                                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                                    >
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
                                      {formData.images.map((_, idx) => (
                                        <div
                                          key={idx}
                                          className={`h-1 rounded-full transition-all ${
                                            idx === previewImageIndex
                                              ? "bg-white w-4"
                                              : "bg-white/50 w-1"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-0">
                              <div className="text-center text-gray-400 dark:text-gray-500">
                                <svg
                                  className="h-8 w-8 mx-auto mb-1 opacity-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <p className="text-[10px]">No image</p>
                              </div>
                            </div>
                          )}

                          {/* Actions Bar */}
                          <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <button type="button" className="text-gray-900 dark:text-gray-100">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </button>
                            <button type="button" className="text-gray-900 dark:text-gray-100">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                            </button>
                            <button type="button" className="text-gray-900 dark:text-gray-100">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                            </button>
                            <div className="flex-1" />
                            <button type="button" className="text-gray-900 dark:text-gray-100">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* View Comments - No caption shown on mockup */}
                          <div className="px-3 py-1.5 flex-shrink-0">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              View all comments
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STORY Format */}
                      {formData.contentType === "STORY" && (
                        <div className="relative h-full w-full bg-black">
                          {/* Story Image/Video */}
                          {formData.images.length > 0 ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={formData.images[previewImageIndex]}
                                alt="Story preview"
                                fill
                                className="object-cover"
                              />
                              {formData.images.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImageIndex(
                                        (prev) =>
                                          (prev - 1 + formData.images.length) %
                                          formData.images.length
                                      )
                                    }
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImageIndex(
                                        (prev) =>
                                          (prev + 1) % formData.images.length
                                      )
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                              <div className="text-center text-white">
                                <svg
                                  className="h-12 w-12 mx-auto mb-2 opacity-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <p className="text-sm">No image</p>
                              </div>
                            </div>
                          )}

                          {/* Story Top Bar */}
                          <div className="absolute top-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                                  BS
                                </div>
                                <span className="text-white font-semibold text-sm">
                                  Bio Sculpture
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-white/50"></div>
                                <div className="w-1 h-1 rounded-full bg-white/50"></div>
                                <div className="w-1 h-1 rounded-full bg-white/50"></div>
                              </div>
                            </div>
                          </div>

                          {/* Story Bottom - Only Hashtags (no caption for stories) */}
                          {formData.hashtags.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                              <div className="flex flex-wrap gap-1">
                                {formData.hashtags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-sm text-white font-semibold"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* REELS Format */}
                      {formData.contentType === "REELS" && (
                        <div className="relative h-full w-full bg-black">
                          {/* Reels Video/Image */}
                          {formData.images.length > 0 ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={formData.images[previewImageIndex]}
                                alt="Reels preview"
                                fill
                                className="object-cover"
                              />
                              {formData.images.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImageIndex(
                                        (prev) =>
                                          (prev - 1 + formData.images.length) %
                                          formData.images.length
                                      )
                                    }
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImageIndex(
                                        (prev) =>
                                          (prev + 1) % formData.images.length
                                      )
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                              <div className="text-center text-white">
                                <svg
                                  className="h-12 w-12 mx-auto mb-2 opacity-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <p className="text-sm">No video/image</p>
                              </div>
                            </div>
                          )}

                          {/* Reels Top Bar */}
                          <div className="absolute top-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                                  BS
                                </div>
                                <span className="text-white font-semibold text-sm">
                                  Bio Sculpture
                                </span>
                              </div>
                              <button className="text-white">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Reels Right Side Actions */}
                          <div className="absolute right-4 bottom-20 flex flex-col gap-4">
                            <button className="flex flex-col items-center gap-1 text-white">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                              <span className="text-xs">1.2K</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 text-white">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              <span className="text-xs">234</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 text-white">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                              <span className="text-xs">89</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 text-white">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Reels Bottom - Only Hashtags (no caption) */}
                          {formData.hashtags.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-semibold text-sm">
                                  Bio Sculpture
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {formData.hashtags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-sm text-white font-semibold"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

