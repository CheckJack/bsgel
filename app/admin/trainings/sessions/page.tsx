"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  MapPin,
  Users,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TrainingSession {
  id: string;
  programId: string;
  program: {
    id: string;
    title: string;
    price: number;
  };
  startDate: string;
  endDate: string;
  location: string | null;
  maxParticipants: number;
  currentBookings: number;
  availableSpots: number;
  isActive: boolean;
}

interface TrainingProgram {
  id: string;
  title: string;
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      fetchSessions(selectedProgramId);
    } else {
      fetchSessions();
    }
  }, [selectedProgramId]);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/trainings?admin=true");
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    }
  };

  const fetchSessions = async (programId?: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ admin: "true", includePast: "true" });
      if (programId) {
        params.append("programId", programId);
      }
      const res = await fetch(`/api/trainings/sessions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to fetch sessions", "error");
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast("Failed to fetch sessions. Please try again.", "error");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingStatus(id);
    try {
      const res = await fetch(`/api/trainings/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: updated.isActive } : s))
        );
        toast(
          `Session ${!currentStatus ? "activated" : "deactivated"} successfully`,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/trainings/sessions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Session deleted successfully", "success");
        fetchSessions(selectedProgramId || undefined);
      } else {
        const data = await res.json();
        toast(data.error || "Failed to delete session", "error");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast("Failed to delete session. Please try again.", "error");
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Training Sessions
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Trainings{" "}
          <span className="mx-2">&gt;</span> Sessions
        </div>
      </div>

      {/* Filter and Add Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Program Filter */}
            <div className="flex-1">
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Add New Button */}
            <Link href="/admin/trainings/sessions/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          {isLoading && sessions.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No sessions found
              </p>
              <Link href="/admin/trainings/sessions/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </Link>
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
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session.program.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          €{session.program.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(session.startDate)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(session.startDate)} - {formatTime(session.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {session.location || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {session.currentBookings} / {session.maxParticipants}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.availableSpots} available
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleStatus(session.id, session.isActive)
                            }
                            disabled={togglingStatus === session.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              session.isActive
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            } ${togglingStatus === session.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                session.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-medium ${
                              session.isActive
                                ? "text-green-800 dark:text-green-200"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {session.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => router.push(`/admin/trainings/sessions/${session.id}`)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(session.id)}
                            disabled={deletingId === session.id}
                          >
                            {deletingId === session.id ? (
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

