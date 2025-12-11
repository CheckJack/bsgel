"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  blog: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to approve comment:", error);
      alert("Failed to approve comment");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this comment?")) return;
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to reject comment:", error);
      alert("Failed to reject comment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blog Comments</h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={statusFilter === "PENDING" ? "default" : "outline"}
          onClick={() => setStatusFilter("PENDING")}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "APPROVED" ? "default" : "outline"}
          onClick={() => setStatusFilter("APPROVED")}
        >
          Approved
        </Button>
        <Button
          variant={statusFilter === "REJECTED" ? "default" : "outline"}
          onClick={() => setStatusFilter("REJECTED")}
        >
          Rejected
        </Button>
        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"}
          onClick={() => setStatusFilter("ALL")}
        >
          All
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No comments found</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {comment.user.name || comment.user.email}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        comment.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        comment.status === "REJECTED" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {comment.status}
                      </span>
                    </div>
                    <Link 
                      href={`/blog/${comment.blog.slug}`}
                      className="text-sm text-blue-600 hover:underline mb-2 block"
                    >
                      Blog: {comment.blog.title}
                    </Link>
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {comment.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(comment.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(comment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

