"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical, Star, Download, RefreshCw, Settings } from "lucide-react";
import Image from "next/image";
import { SettingsModal } from "./settings-modal";

interface Comment {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string;
  createdAt: string;
  type?: "product_review" | "blog_comment";
  productName?: string;
  blogTitle?: string;
  status?: "pending" | "approved";
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />;
        } else if (i === fullStars && hasHalfStar) {
          return (
            <div key={i} className="relative">
              <Star className="h-4 w-4 text-gray-300" />
              <Star
                className="h-4 w-4 fill-yellow-400 text-yellow-400 absolute left-0 top-0 overflow-hidden"
                style={{ width: "50%" }}
              />
            </div>
          );
        } else {
          return <Star key={i} className="h-4 w-4 text-gray-300" />;
        }
      })}
    </div>
  );
}

export function NewComments() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const allComments: any[] = [];
      
      // Fetch pending product reviews first
      try {
        const pendingRes = await fetch("/api/admin/reviews?status=PENDING&limit=5", {
          cache: 'no-store',
        });
        
        console.log("Pending reviews API response status:", pendingRes.status);
        
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          console.log("Pending reviews data:", pendingData);
          
          if (pendingData.reviews && pendingData.reviews.length > 0) {
            const pendingReviews = pendingData.reviews.map((review: any) => ({
              id: review.id,
              name: review.user?.name || review.user?.email || "Anonymous",
              rating: review.rating || 0,
              comment: review.content || review.title || "",
              avatar: review.user?.image || "/api/placeholder/40/40",
              createdAt: review.createdAt,
              type: "product_review",
              productName: review.product?.name,
              status: "pending",
            }));
            allComments.push(...pendingReviews);
            console.log("Added pending reviews:", pendingReviews.length);
          }
        } else {
          const errorData = await pendingRes.json().catch(() => ({}));
          console.error("Failed to fetch pending reviews:", {
            status: pendingRes.status,
            error: errorData
          });
        }
      } catch (error) {
        console.error("Error fetching pending reviews:", error);
      }

      // If no pending reviews, show recently approved reviews
      if (allComments.length === 0) {
        try {
          const approvedRes = await fetch("/api/admin/reviews?status=APPROVED&limit=4", {
            cache: 'no-store',
          });
          
          console.log("Approved reviews API response status:", approvedRes.status);
          
          if (approvedRes.ok) {
            const approvedData = await approvedRes.json();
            console.log("Approved reviews data:", approvedData);
            
            if (approvedData.reviews && approvedData.reviews.length > 0) {
              const approvedReviews = approvedData.reviews.map((review: any) => ({
                id: review.id,
                name: review.user?.name || review.user?.email || "Anonymous",
                rating: review.rating || 0,
                comment: review.content || review.title || "",
                avatar: review.user?.image || "/api/placeholder/40/40",
                createdAt: review.createdAt,
                type: "product_review",
                productName: review.product?.name,
                status: "approved",
              }));
              allComments.push(...approvedReviews);
              console.log("Added approved reviews:", approvedReviews.length);
            }
          }
        } catch (error) {
          console.error("Error fetching approved reviews:", error);
        }
      }

      // Note: Blog comments API only returns APPROVED comments
      // To show pending blog comments, we would need an admin endpoint
      // For now, we'll focus on product reviews which are more important
      
      console.log("Total comments before sorting:", allComments.length);
      
      // Sort by creation date (newest first) and take latest 4
      const sortedComments = allComments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);
      
      console.log("Final comments to display:", sortedComments.length);
      setComments(sortedComments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const exportToCSV = (data: Comment[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }

    const csvContent = [
      "Name,Rating,Comment",
      ...data.map((comment) =>
        [
          `"${comment.name}"`,
          comment.rating,
          `"${comment.comment.replace(/"/g, '""')}"`
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: Comment[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    const format = window.confirm("Export as CSV? (OK for CSV, Cancel for JSON)");
    if (format) {
      exportToCSV(comments, "comments");
    } else {
      exportToJSON(comments, "comments");
    }
    setIsOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchComments();
    setIsRefreshing(false);
    setIsOpen(false);
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
    setIsOpen(false);
  };

  const handleSettingsSave = (settings: any) => {
    console.log("Comments settings saved:", settings);
    // Apply settings here
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Comments</CardTitle>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No reviews found</p>
            <p className="text-xs mt-2">
              {comments.length === 0 && "Check the browser console (F12) for debugging information"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-semibold">
                  {comment.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {comment.name}
                    </div>
                    {comment.type === "product_review" && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        comment.status === "pending" 
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      }`}>
                        {comment.status === "pending" ? "Pending Review" : "Product Review"}
                      </span>
                    )}
                    {comment.type === "blog_comment" && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
                        Blog Comment
                      </span>
                    )}
                  </div>
                  {comment.productName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Product: {comment.productName}
                    </p>
                  )}
                  {comment.blogTitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Blog: {comment.blogTitle}
                    </p>
                  )}
                  <div className="mb-2">
                    <StarRating rating={comment.rating} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {comment.comment}
                  </p>
                  {comment.createdAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="New Comments"
        type="comments"
        onSave={handleSettingsSave}
      />
    </Card>
  );
}

