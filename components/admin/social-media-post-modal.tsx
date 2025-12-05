"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
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

interface SocialMediaPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPost: SocialMediaPost | null;
  onSave: () => void;
  adminUsers: Array<{ id: string; name: string | null; email: string }>;
  isLoadingAdmins: boolean;
}

export function SocialMediaPostModal({
  isOpen,
  onClose,
  editingPost,
  onSave,
  adminUsers,
  isLoadingAdmins,
}: SocialMediaPostModalProps) {
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (editingPost) {
      const scheduledDate = new Date(editingPost.scheduledDate);
      setFormData({
        platform: editingPost.platform,
        contentType: editingPost.contentType || "POST",
        caption: editingPost.caption,
        images: editingPost.images,
        scheduledDate: scheduledDate.toISOString().slice(0, 10),
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        status: editingPost.status,
        hashtags: editingPost.hashtags,
        hashtagInput: "",
        reviewComments: editingPost.reviewComments || "",
        assignedReviewerId: editingPost.assignedReviewerId || "",
      });
      setPreviewImageIndex(0);
      if (editingPost.images && editingPost.images.length > 0) {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = editingPost.images[0];
      } else {
        setImageDimensions(null);
      }
    } else {
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
  }, [editingPost, isOpen]);

  useEffect(() => {
    if (formData.images.length > 0 && previewImageIndex >= formData.images.length) {
      setPreviewImageIndex(0);
    }
    
    if (formData.images.length > 0 && formData.contentType === "POST") {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = formData.images[previewImageIndex];
    }
  }, [formData.images, previewImageIndex, formData.contentType]);

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
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setFormData({
            ...formData,
            images: [...formData.images, dataUrl],
          });
          
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

      if (formData.status === "PENDING_REVIEW" && !formData.assignedReviewerId) {
        setError("Please select a reviewer when status is set to Pending Review.");
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        platform: formData.platform,
        contentType: formData.contentType,
        caption: formData.contentType === "STORY" ? "" : formData.caption,
        images: formData.images,
        scheduledDate: scheduledDateTime.toISOString(),
        status: formData.status,
        hashtags: formData.hashtags,
      };

      if (formData.status === "PENDING_REVIEW" && formData.assignedReviewerId) {
        payload.assignedReviewerId = formData.assignedReviewerId;
      }

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
        onSave();
        onClose();
      } else {
        let errorMessage = data.error || "Failed to save post.";
        if (data.code === "TABLE_NOT_FOUND") {
          errorMessage = `Database setup required: ${data.details || data.error}`;
        } else if (data.details) {
          errorMessage = `${data.error}\n\nDetails: ${data.details}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      setError("Failed to save post. Please check if the database migration has been run.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Calculate dynamic size for POST based on image dimensions
  let phoneWidth = 416;
  let screenWidth = 400;
  let screenHeight = 700;
  
  if (formData.contentType === "POST" && imageDimensions && formData.images.length > 0) {
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    const maxWidth = 900;
    const maxHeight = 1000;
    const minSize = 300;
    const scaleFactor = 0.8;
    
    let calculatedWidth = imageDimensions.width * scaleFactor;
    let calculatedHeight = imageDimensions.height * scaleFactor;
    
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
    
    if (aspectRatio > 1) {
      if (calculatedWidth < minSize) {
        calculatedWidth = minSize;
        calculatedHeight = calculatedWidth / aspectRatio;
      }
    } else if (aspectRatio < 1) {
      if (calculatedHeight < minSize) {
        calculatedHeight = minSize;
        calculatedWidth = calculatedHeight * aspectRatio;
      }
    } else {
      if (calculatedWidth < minSize) {
        calculatedWidth = minSize;
        calculatedHeight = minSize;
      }
    }
    
    screenWidth = calculatedWidth;
    screenHeight = calculatedHeight;
    phoneWidth = screenWidth + 16;
  } else if (formData.contentType === "POST") {
    screenWidth = 400;
    screenHeight = 400;
    phoneWidth = 416;
  } else if (formData.contentType === "STORY") {
    // Stories - slightly smaller to prevent margins from being cut
    screenWidth = 380;
    screenHeight = 670;
    phoneWidth = 396;
  } else {
    // Reels
    screenWidth = 400;
    screenHeight = 700;
    phoneWidth = 416;
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingPost ? "Edit Post" : "Create New Post"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-6 lg:p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
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
              <label className="block text-sm font-medium mb-1">Content Type</label>
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
                <label className="block text-sm font-medium mb-1">Caption</label>
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
              <label className="block text-sm font-medium mb-1">Images</label>
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
                <label className="block text-sm font-medium mb-1">Scheduled Date</label>
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
                <label className="block text-sm font-medium mb-1">Scheduled Time</label>
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
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const newStatus = e.target.value as SocialMediaPost["status"];
                  setFormData({
                    ...formData,
                    status: newStatus,
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
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Hashtags</label>
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
                <label className="block text-sm font-medium mb-1">Review Comments</label>
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
                onClick={onClose}
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

        <div className="w-full lg:w-1/2 bg-gray-50 dark:bg-gray-900 p-6 lg:p-8 overflow-y-auto flex items-center justify-center">
          <div className="w-full flex justify-center">
            <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: `${phoneWidth}px` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
              
              <div 
                className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative"
                style={{ width: `${screenWidth}px`, height: `${screenHeight}px` }}
              >
                {formData.contentType === "POST" && (
                  <div className="bg-white dark:bg-gray-800 h-full w-full flex flex-col">
                    <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        BS
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate">Bio Sculpture</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {formData.scheduledDate && formData.scheduledTime
                            ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Now"}
                        </div>
                      </div>
                    </div>

                    {formData.images.length > 0 ? (
                      <div className="relative flex-1 min-h-0">
                        <div 
                          className="relative w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center cursor-grab active:cursor-grabbing"
                          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                          onTouchEnd={() => {
                            if (!touchStart || !touchEnd) return;
                            const distance = touchStart - touchEnd;
                            const minSwipeDistance = 50;
                            if (distance > minSwipeDistance) {
                              setPreviewImageIndex((prev) => (prev + 1) % formData.images.length);
                            } else if (distance < -minSwipeDistance) {
                              setPreviewImageIndex((prev) => (prev - 1 + formData.images.length) % formData.images.length);
                            }
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
                                onClick={() => setPreviewImageIndex((prev) => (prev - 1 + formData.images.length) % formData.images.length)}
                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewImageIndex((prev) => (prev + 1) % formData.images.length)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
                                {formData.images.map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all ${
                                      idx === previewImageIndex ? "bg-white w-4" : "bg-white/50 w-1"
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
                          <svg className="h-8 w-8 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-[10px]">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.contentType === "STORY" && (
                  <div className="relative h-full w-full bg-black">
                    {formData.images.length > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={formData.images[previewImageIndex]}
                          alt="Story preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                        <div className="text-center text-white">
                          <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.contentType === "REELS" && (
                  <div className="relative h-full w-full bg-black">
                    {formData.images.length > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={formData.images[previewImageIndex]}
                          alt="Reels preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                        <div className="text-center text-white">
                          <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No video/image</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

