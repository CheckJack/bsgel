"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Copy, FileText, Loader2 } from "lucide-react";
import Image from "next/image";
import { createWorker } from "tesseract.js";

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

interface SocialMediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost | null;
  onStatusChange?: (postId: string, newStatus: SocialMediaPost["status"], comments?: string) => void;
}

export function SocialMediaPreviewModal({
  isOpen,
  onClose,
  post,
  onStatusChange,
}: SocialMediaPreviewModalProps) {
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTexts, setExtractedTexts] = useState<Record<number, string>>({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (post && post.images.length > 0) {
      setPreviewImageIndex(0);
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = post.images[0];
    } else {
      setImageDimensions(null);
    }
  }, [post, isOpen]);

  useEffect(() => {
    if (post && post.images.length > 0 && !extractedTexts[previewImageIndex]) {
      extractTextFromImage(post.images[previewImageIndex], previewImageIndex);
    } else if (post && extractedTexts[previewImageIndex]) {
      setExtractedText(extractedTexts[previewImageIndex]);
    }
  }, [post, previewImageIndex]);

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const extractTextFromImage = async (imageSrc: string, index: number) => {
    if (extractedTexts[index]) {
      setExtractedText(extractedTexts[index]);
      return;
    }

    setIsExtracting(true);
    try {
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(imageSrc);
      await worker.terminate();
      
      const cleanedText = text.trim();
      setExtractedTexts((prev) => ({ ...prev, [index]: cleanedText }));
      setExtractedText(cleanedText);
    } catch (error) {
      console.error("OCR Error:", error);
      setExtractedText("Unable to extract text from image.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopyText = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
    }
  };

  const handleStatusChange = async (newStatus: SocialMediaPost["status"], comments?: string) => {
    if (!post || !onStatusChange) return;

    await onStatusChange(post.id, newStatus, comments);
    onClose();
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
    setRejectionReason("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setShowRejectModal(false);
    await handleStatusChange("REJECTED", rejectionReason.trim());
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  if (!isOpen || !post) return null;
  
  const availableHeight = viewportSize.height - 80; // Header height
  const availableWidth = viewportSize.width - 400; // Info card width (384px) + padding
  
  // Calculate dynamic size for POST based on image dimensions
  let phoneWidth = 416;
  let screenWidth = 400;
  let screenHeight = 700;
  
  if (post.contentType === "POST" && imageDimensions && post.images.length > 0) {
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    
    // Calculate size to fit within available viewport - ensure it fits completely
    let calculatedWidth = availableWidth * 0.9;
    let calculatedHeight = calculatedWidth / aspectRatio;
    
    // If height exceeds available space, scale down based on height
    if (calculatedHeight > availableHeight * 0.9) {
      calculatedHeight = availableHeight * 0.9;
      calculatedWidth = calculatedHeight * aspectRatio;
    }
    
    // Ensure width also fits
    if (calculatedWidth > availableWidth * 0.9) {
      calculatedWidth = availableWidth * 0.9;
      calculatedHeight = calculatedWidth / aspectRatio;
    }
    
    screenWidth = calculatedWidth;
    screenHeight = calculatedHeight;
    phoneWidth = screenWidth + 16;
  } else if (post.contentType === "POST") {
    // Square post - fit to available space (use the smaller dimension)
    const size = Math.min(availableWidth * 0.8, availableHeight * 0.8);
    screenWidth = size;
    screenHeight = size;
    phoneWidth = size + 16;
  } else if (post.contentType === "STORY") {
    // Story aspect ratio is typically 9:16
    const storyAspectRatio = 9 / 16;
    let calculatedWidth = availableWidth * 0.7;
    let calculatedHeight = calculatedWidth / storyAspectRatio;
    
    // Ensure it fits in height
    if (calculatedHeight > availableHeight * 0.9) {
      calculatedHeight = availableHeight * 0.9;
      calculatedWidth = calculatedHeight * storyAspectRatio;
    }
    
    screenWidth = calculatedWidth;
    screenHeight = calculatedHeight;
    phoneWidth = screenWidth + 16;
  } else {
    // Reels - same as story
    const reelsAspectRatio = 9 / 16;
    let calculatedWidth = availableWidth * 0.7;
    let calculatedHeight = calculatedWidth / reelsAspectRatio;
    
    // Ensure it fits in height
    if (calculatedHeight > availableHeight * 0.9) {
      calculatedHeight = availableHeight * 0.9;
      calculatedWidth = calculatedHeight * reelsAspectRatio;
    }
    
    screenWidth = calculatedWidth;
    screenHeight = calculatedHeight;
    phoneWidth = screenWidth + 16;
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Post Preview</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Section */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4 overflow-hidden">
            <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl flex-shrink-0" style={{ 
              width: `${phoneWidth}px`,
              height: `${screenHeight + 16}px`
            }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
              
              <div 
                className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative flex-shrink-0"
                style={{ width: `${screenWidth}px`, height: `${screenHeight}px`, maxWidth: '100%', maxHeight: '100%' }}
              >
                {post.contentType === "POST" && (
                  <div className="bg-white dark:bg-gray-800 h-full w-full flex flex-col">
                    <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        BS
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate">Bio Sculpture</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {new Date(post.scheduledDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    {post.images.length > 0 ? (
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
                              setPreviewImageIndex((prev) => (prev + 1) % post.images.length);
                            } else if (distance < -minSwipeDistance) {
                              setPreviewImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
                            }
                            setTouchStart(null);
                            setTouchEnd(null);
                          }}
                        >
                          <Image
                            src={post.images[previewImageIndex]}
                            alt="Post preview"
                            fill
                            className="object-contain select-none"
                            draggable={false}
                          />
                          {post.images.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length)}
                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewImageIndex((prev) => (prev + 1) % post.images.length)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
                                {post.images.map((_, idx) => (
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

                    {post.caption && (
                      <div className="px-3 py-2 flex-shrink-0">
                        <p className="text-xs text-gray-900 dark:text-gray-100 line-clamp-3">{post.caption}</p>
                      </div>
                    )}

                    {post.hashtags.length > 0 && (
                      <div className="px-3 pb-2 flex flex-wrap gap-1 flex-shrink-0">
                        {post.hashtags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] text-blue-600 dark:text-blue-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {post.contentType === "STORY" && (
                  <div className="relative h-full w-full bg-black">
                    {post.images.length > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={post.images[previewImageIndex]}
                          alt="Story preview"
                          fill
                          className="object-cover"
                        />
                        {post.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewImageIndex((prev) => (prev + 1) % post.images.length)}
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
                          <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No image</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                            BS
                          </div>
                          <span className="text-white font-semibold text-sm">Bio Sculpture</span>
                        </div>
                      </div>
                    </div>

                    {post.hashtags.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-sm text-white font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {post.contentType === "REELS" && (
                  <div className="relative h-full w-full bg-black">
                    {post.images.length > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={post.images[previewImageIndex]}
                          alt="Reels preview"
                          fill
                          className="object-cover"
                        />
                        {post.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewImageIndex((prev) => (prev + 1) % post.images.length)}
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
                          <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No video/image</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                            BS
                          </div>
                          <span className="text-white font-semibold text-sm">Bio Sculpture</span>
                        </div>
                      </div>
                    </div>

                    {post.hashtags.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-semibold text-sm">Bio Sculpture</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, idx) => (
                            <span key={idx} className="text-sm text-white font-semibold">
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
          </div>

          {/* Info Card Section */}
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Action Buttons */}
              {onStatusChange && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => handleStatusChange("APPROVED")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={handleRejectClick}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusChange("DRAFT")}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      Move to Draft
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Extracted Text Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Extracted Text
                    </CardTitle>
                    {extractedText && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyText}
                        className="h-6 w-6"
                        title="Copy text"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isExtracting ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Extracting text...</span>
                    </div>
                  ) : extractedText ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {extractedText}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No text found in image
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Post Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Post Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Platform:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{post.platform}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{post.contentType || "POST"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Scheduled:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {new Date(post.scheduledDate).toLocaleString()}
                    </span>
                  </div>
                  {post.caption && (
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Caption:</span>
                      <p className="mt-1 text-gray-900 dark:text-gray-100 text-xs">{post.caption}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[60] flex items-center justify-center p-4" onClick={handleRejectCancel}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  Reject Post
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleRejectCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  What is incorrect? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please describe what is incorrect with this post..."
                  rows={5}
                  className="w-full"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This feedback will be saved as review comments.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleRejectCancel}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
