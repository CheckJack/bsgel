"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TrainingProgram {
  id: string;
  title: string;
  days?: Array<{ day: number; hours: number }> | null;
  totalHours?: number;
}

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

export default function NewSessionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
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
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/trainings?admin=true");
      if (res.ok) {
        const data = await res.json();
        // Store full program data including days
        const activePrograms = data.filter((p: TrainingProgram & { isActive: boolean }) => p.isActive);
        setPrograms(activePrograms);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    }
  };

  const handleProgramChange = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    setSelectedProgram(program || null);
    
    // If start date is already set, recalculate end date before updating formData
    if (formData.startDate && program) {
      calculateEndDate(formData.startDate, program);
    }
    
    setFormData((prev) => ({ ...prev, programId }));
  };

  const calculateEndDate = (startDateStr: string, program: TrainingProgram) => {
    if (!startDateStr || !program) return;
    
    const startDate = new Date(startDateStr);
    let numberOfDays = 1;
    
    // Get number of days from the program
    if (program.days && Array.isArray(program.days) && program.days.length > 0) {
      numberOfDays = program.days.length;
    }
    
    // Calculate end date (numberOfDays - 1 days after start date, since day 1 is the start date)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (numberOfDays - 1));
    
    // Set end time to same as start time (or adjust as needed)
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
    
    // Auto-calculate end date if program is selected
    if (selectedProgram) {
      calculateEndDate(startDate, selectedProgram);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/trainings/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: formData.programId,
          startDate: localDateTimeInputToIso(formData.startDate),
          endDate: localDateTimeInputToIso(formData.endDate),
          location: formData.location || null,
          format: formData.format,
          maxParticipants: parseInt(formData.maxParticipants),
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        toast("Training session created successfully", "success");
        router.push("/admin/trainings/sessions");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to create training session", "error");
      }
    } catch (error) {
      console.error("Failed to create training session:", error);
      toast("Failed to create training session. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create Training Session
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Trainings{" "}
          <span className="mx-2">&gt;</span> Sessions <span className="mx-2">&gt;</span> New
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program */}
            <div>
              <label
                htmlFor="programId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Training Program <span className="text-red-500">*</span>
              </label>
              <select
                id="programId"
                required
                value={formData.programId}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
              {selectedProgram && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedProgram.days && Array.isArray(selectedProgram.days) && selectedProgram.days.length > 0
                    ? `${selectedProgram.days.length} day${selectedProgram.days.length !== 1 ? "s" : ""} training program`
                    : "Training program selected"}
                </p>
              )}
            </div>

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
              {selectedProgram && formData.startDate && (
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

            {/* Format */}
            <div>
              <label
                htmlFor="format"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Format <span className="text-red-500">*</span>
              </label>
              <select
                id="format"
                required
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as "ONLINE" | "PRESENTIAL" | "HYBRID" })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PRESENTIAL">Presential (In-Person)</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </select>
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
                placeholder="e.g., London Training Center"
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
                    Creating...
                  </>
                ) : (
                  "Create Session"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

