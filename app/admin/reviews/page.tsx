"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2, Star } from "lucide-react";
import Image from "next/image";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  status: string;
  verifiedBuyer: boolean;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
  product: {
    id: string;
    name: string;
    image: string | null;
  };
  companyResponse: string | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch reviews:", errorData.error || "Unknown error");
        setReviews([]);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        alert("Review approved successfully!");
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve review");
      }
    } catch (error) {
      console.error("Failed to approve review:", error);
      alert("Failed to approve review. Please try again.");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        alert("Review rejected successfully!");
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject review");
      }
    } catch (error) {
      console.error("Failed to reject review:", error);
      alert("Failed to reject review. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Review deleted successfully!");
        fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Product Reviews</h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"}
          onClick={() => setStatusFilter("ALL")}
        >
          All
        </Button>
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
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No reviews found</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 flex-1">
                    {review.product.image && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={review.product.image}
                          alt={review.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {review.user.name || review.user.email}
                        </span>
                        {review.verifiedBuyer && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Verified Buyer
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          review.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          review.status === "REJECTED" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {review.status}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Product: <span className="font-medium">{review.product.name}</span>
                      </p>
                      {review.title && (
                        <h3 className="font-medium mb-2">{review.title}</h3>
                      )}
                      <p className="text-gray-700 mb-2">{review.content}</p>
                      {review.companyResponse && (
                        <div className="mt-2 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium mb-1">Company Response:</p>
                          <p className="text-sm text-gray-700">{review.companyResponse}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {review.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(review.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(review.id)}
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
                      onClick={() => handleDelete(review.id)}
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

