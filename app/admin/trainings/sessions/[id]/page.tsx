"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const toLocalDateTimeInput = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const localDateTimeInputToIso = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [program, setProgram] = useState<{ id: string; days?: Array<{ day: number }> | null } | null>(null);
  const [formData, setFormData] = useState({
    programId: "",
    startDate: "",
    endDate: "",
    location: "",
    format: "PRESENTIAL" as "ONLINE" | "PRESENTIAL" | "HYBRID",
    maxParticipants: "10",
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/trainings/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        const startDate = toLocalDateTimeInput(data.startDate);
        const endDate = toLocalDateTimeInput(data.endDate);
        setFormData({
          programId: data.programId,
          startDate,
          endDate,
          location: data.location || "",
          format: data.format || "PRESENTIAL",
          maxParticipants: data.maxParticipants.toString(),
          isActive: data.isActive,
        });
        
        // Fetch program to get days info
        if (data.programId) {
          const programRes = await fetch(`/api/trainings/${data.programId}`);
          if (programRes.ok) {
            const programData = await programRes.json();
            setProgram(programData);
          }
        }
      } else {
        const errorData = await res.json();
        toast(errorData.error || "Failed to load session", "error");
        router.push("/admin/trainings/sessions");
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      toast("Failed to load session. Please try again.", "error");
      router.push("/admin/trainings/sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEndDate = (startDateStr: string) => {
    if (!startDateStr || !program) return;
    
    const startDate = new Date(startDateStr);
    let numberOfDays = 1;
    
    // Get number of days from the program
    if (program.days && Array.isArray(program.days) && program.days.length > 0) {
      numberOfDays = program.days.length;
    }
    
    // Calculate end date (numberOfDays - 1 days after start date)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (numberOfDays - 1));
    
    // Format as datetime-local string
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, "0");
    const day = String(endDate.getDate()).padStart(2, "0");
    const hours = String(endDate.getHours()).padStart(2, "0");
    const minutes = String(endDate.getMinutes()).padStart(2, "0");
    
    const endDateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, endDate: endDateStr }));
  };

  const handleStartDateChange = (startDate: string) => {
    setFormData((prev) => ({ ...prev, startDate }));
    
    // Auto-calculate end date if program is loaded
    if (program) {
      calculateEndDate(startDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/trainings/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: localDateTimeInputToIso(formData.startDate),
          endDate: localDateTimeInputToIso(formData.endDate),
          location: formData.location || null,
          format: formData.format,
          maxParticipants: parseInt(formData.maxParticipants),
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        toast("Training session updated successfully", "success");
        router.push("/admin/trainings/sessions");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to update session", "error");
      }
    } catch (error) {
      console.error("Failed to update session:", error);
      toast("Failed to update session. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Training Session
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Trainings{" "}
          <span className="mx-2">&gt;</span> Sessions <span className="mx-2">&gt;</span> Edit
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Start Date and Time */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="startDate"
                required
                value={toLocalDateTimeInput(formData.startDate)}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {program && formData.startDate && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  End date will be automatically calculated based on the training program duration
                </p>
              )}
            </div>

            {/* End Date and Time */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="endDate"
                required
                value={toLocalDateTimeInput(formData.endDate)}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Participants */}
            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Maximum Participants <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maxParticipants"
                required
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active (visible to users)
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link href="/admin/trainings/sessions">
                <Button type="button" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

