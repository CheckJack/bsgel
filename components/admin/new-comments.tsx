"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical, Star, Download, RefreshCw, Settings } from "lucide-react";
import Image from "next/image";
import { SettingsModal } from "./settings-modal";

interface Comment {
  name: string;
  rating: number;
  comment: string;
  avatar: string;
}

const comments: Comment[] = [
  {
    name: "Kathryn Murphy",
    rating: 3.5,
    comment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras nec dolor vel est interdum",
    avatar: "/api/placeholder/40/40",
  },
  {
    name: "Leslie Alexander",
    rating: 3.5,
    comment: "Cras nec viverra justo, a mattis lacus. Vestibulum eleifend, leo sit amet aliquam laoreet, turpis leo vulputate orci",
    avatar: "/api/placeholder/40/40",
  },
  {
    name: "Devon Lane",
    rating: 3.5,
    comment: "Morbi eget commodo diam. Praesent dignissim purus ac turpis porta",
    avatar: "/api/placeholder/40/40",
  },
  {
    name: "Eleanor Pena",
    rating: 3.5,
    comment: "Phasellus et eros ullamcorper, efficitur eros eget, pharetra ante. Sed blandit risus vitae dolor feugiat, eu vulputate elit rhoncus",
    avatar: "/api/placeholder/40/40",
  },
];

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
  const menuRef = useRef<HTMLDivElement>(null);

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
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, you would fetch fresh comments here
    alert("Comments refreshed!");
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
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={index} className="flex gap-3 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-semibold">
                {comment.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                  {comment.name}
                </div>
                <div className="mb-2">
                  <StarRating rating={comment.rating} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {comment.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
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

