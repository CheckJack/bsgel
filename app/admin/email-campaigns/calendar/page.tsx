"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Calendar,
  List,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Mail,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { EmailCampaignModal } from "@/components/admin/email-campaign-modal";

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  pdfUrl?: string | null;
  scheduledDate: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SCHEDULED" | "SENT";
  reviewComments?: string;
  assignedReviewerId?: string;
  recipientList: string[];
  recipientType: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailCampaignsCalendarPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [currentStartDate, setCurrentStartDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [timezone, setTimezone] = useState("Europe/Lisbon");

  // Generate 6 days starting from currentStartDate
  const daysOfWeek: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentStartDate);
    date.setDate(currentStartDate.getDate() + i);
    daysOfWeek.push(date);
  }

  const weekStart = daysOfWeek[0];
  const weekEnd = daysOfWeek[5];

  // Generate time slots (24 hours)
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    const timeString = hour === 0 
      ? "12:00am" 
      : hour < 12 
      ? `${hour}:00am` 
      : hour === 12 
      ? "12:00pm" 
      : `${hour - 12}:00pm`;
    timeSlots.push({ hour, label: timeString });
  }

  useEffect(() => {
    fetchCampaigns();
  }, [currentStartDate]);

  const fetchAdminUsers = async () => {
    try {
      setIsLoadingAdmins(true);
      const res = await fetch("/api/users?role=ADMIN");
      if (res.ok) {
        const users = await res.json();
        setAdminUsers(users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch admin users:", error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      // Fetch campaigns for the entire week
      const startDate = new Date(weekStart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(weekEnd);
      endDate.setHours(23, 59, 59, 999);

      const res = await fetch(`/api/email-campaigns`);
      if (res.ok) {
        const data = await res.json();
        // Filter campaigns for current week
        const weekCampaigns = data.filter((campaign: EmailCampaign) => {
          if (!campaign.scheduledDate) return false;
          const campaignDate = new Date(campaign.scheduledDate);
          return campaignDate >= startDate && campaignDate <= endDate;
        });
        setCampaigns(weekCampaigns);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (campaign?: EmailCampaign, day?: Date, hour?: number) => {
    fetchAdminUsers();
    if (campaign) {
      setEditingCampaign(campaign);
    } else if (day && hour !== undefined) {
      // Create new campaign at specific time
      const scheduledDate = new Date(day);
      scheduledDate.setHours(hour, 0, 0, 0);
      setEditingCampaign(null);
    } else {
      setEditingCampaign(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
  };

  const getCampaignsForTimeSlot = (day: Date, hour: number): EmailCampaign[] => {
    return campaigns.filter((campaign) => {
      if (!campaign.scheduledDate) return false;
      const campaignDate = new Date(campaign.scheduledDate);
      return (
        campaignDate.getDate() === day.getDate() &&
        campaignDate.getMonth() === day.getMonth() &&
        campaignDate.getFullYear() === day.getFullYear() &&
        campaignDate.getHours() === hour
      );
    });
  };

  const navigateDays = (direction: "prev" | "next") => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 6 : -6));
    setCurrentStartDate(newDate);
  };

  const goToToday = () => {
    setCurrentStartDate(new Date());
  };

  const formatDateRange = () => {
    const start = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const end = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${start} - ${end}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <Link href="/admin/email-campaigns">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-1 border-b-2 border-black dark:border-white pb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-semibold">Calendar</span>
              </div>
              <Link href="/admin/email-campaigns/list">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                  List
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{getCurrentTime()} - {timezone}</span>
              </div>
            </div>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Day Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigateDays("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{formatDateRange()}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigateDays("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleOpenModal()} className="bg-black dark:bg-white text-white dark:text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Create campaign
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            <div className="p-4 border-r border-gray-200 dark:border-gray-700"></div>
            {daysOfWeek.map((day, index) => {
              const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
              const dayNumber = day.getDate();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-r border-gray-200 dark:border-gray-700 ${
                    isWeekend ? "bg-green-50 dark:bg-green-900/20" : ""
                  }`}
                >
                  <div className="font-semibold text-sm">{dayNumber}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{dayName}</div>
                </div>
              );
            })}
          </div>

          {/* Time Slots Grid */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                {/* Time Label */}
                <div className="p-3 border-r border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {timeSlot.label}
                </div>

                {/* Day Cells */}
                {daysOfWeek.map((day, dayIndex) => {
                  const cellCampaigns = getCampaignsForTimeSlot(day, timeSlot.hour);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-1 hover:ring-blue-400 dark:hover:ring-blue-600 transition-all relative group min-h-[60px] ${
                        isWeekend ? "bg-green-50/30 dark:bg-green-900/10" : ""
                      }`}
                      onClick={() => handleOpenModal(undefined, day, timeSlot.hour)}
                    >
                      {/* Campaigns in this time slot */}
                      {cellCampaigns.length > 0 ? (
                        <div className="space-y-1">
                          {cellCampaigns.slice(0, 2).map((campaign) => (
                            <div
                              key={campaign.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(campaign);
                              }}
                              className="text-[10px] p-1 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                            >
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{campaign.subject.substring(0, 15)}...</span>
                            </div>
                          ))}
                          {cellCampaigns.length > 2 && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                              +{cellCampaigns.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <EmailCampaignModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingCampaign={editingCampaign}
        onSave={fetchCampaigns}
        adminUsers={adminUsers}
        isLoadingAdmins={isLoadingAdmins}
        defaultScheduledDate={editingCampaign ? undefined : new Date()}
      />
    </div>
  );
}

