"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  Clock,
} from "lucide-react";

interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  image: string | null;
  isActive: boolean;
  upcomingSessions: number;
  totalBookings: number;
  includedProducts?: Array<{
    id: string;
    name: string;
    price: number;
    image: string | null;
    quantity: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTrainingsPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchPrograms();
  }, [debouncedSearchQuery]);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ admin: "true" });
      if (debouncedSearchQuery.trim()) {
        // Note: API doesn't support search yet, but we can filter client-side
      }
      const res = await fetch(`/api/trainings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data;
        if (debouncedSearchQuery.trim()) {
          filtered = data.filter((p: TrainingProgram) =>
            p.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
          );
        }
        setPrograms(filtered);
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to fetch training programs", "error");
        setPrograms([]);
      }
    } catch (error) {
      console.error("Failed to fetch training programs:", error);
      toast("Failed to fetch training programs. Please try again.", "error");
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingStatus(id);
    try {
      const res = await fetch(`/api/trainings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPrograms((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: updated.isActive } : p))
        );
        toast(
          `Training program ${!currentStatus ? "activated" : "deactivated"} successfully`,
          "success"
        );
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast("Failed to update status. Please try again.", "error");
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the training program "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/trainings/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Training program deleted successfully", "success");
        fetchPrograms();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete training program", "error");
      }
    } catch (error) {
      console.error("Failed to delete training program:", error);
      toast("Failed to delete training program. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Training Programs
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Trainings{" "}
          <span className="mx-2">&gt;</span> Programs
        </div>
      </div>

      {/* Search and Add Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search training programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Add New Button */}
            <div className="flex gap-2">
              <Link href="/admin/trainings/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>
              </Link>
              <Link href="/admin/trainings/sessions">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Sessions
                </Button>
              </Link>
              <Link href="/admin/trainings/bookings">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Bookings
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          {isLoading && programs.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No training programs found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {debouncedSearchQuery
                    ? "Try adjusting your search"
                    : "Get started by creating your first training program"}
                </p>
                {!debouncedSearchQuery && (
                  <Link href="/admin/trainings/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Program
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {programs.map((program) => (
                    <tr
                      key={program.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Program Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {program.image && (
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={program.image}
                                alt={program.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                              {program.title}
                            </p>
                            {program.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                                {program.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Details Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Clock className="h-4 w-4" />
                            <span>{program.duration} hours</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <span>€{program.price.toFixed(2)}</span>
                          </div>
                          {program.includedProducts && program.includedProducts.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {program.includedProducts.length} product{program.includedProducts.length !== 1 ? "s" : ""} included
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sessions Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          <div>{program.upcomingSessions} upcoming</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {program.totalBookings} bookings
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleStatus(program.id, program.isActive)
                            }
                            disabled={togglingStatus === program.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              program.isActive
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            } ${togglingStatus === program.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            title={
                              program.isActive
                                ? "Click to deactivate"
                                : "Click to activate"
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                program.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-medium ${
                              program.isActive
                                ? "text-green-800 dark:text-green-200"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {program.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Created Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(program.createdAt)}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/trainings/${program.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(program.id, program.title)}
                            disabled={deletingId === program.id}
                          >
                            {deletingId === program.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

