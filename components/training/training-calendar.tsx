"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  format?: "ONLINE" | "PRESENTIAL" | "HYBRID";
  maxParticipants: number;
  currentBookings: number;
  availableSpots: number;
  isActive: boolean;
}

interface TrainingCalendarProps {
  sessions: TrainingSession[];
  onDateClick: (session: TrainingSession) => void;
  selectedDate: string | null;
}

const getLocalDateKey = (value: string | Date) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function TrainingCalendar({ sessions, onDateClick, selectedDate }: TrainingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Group sessions by date (YYYY-MM-DD)
  const sessionsByDate = new Map<string, TrainingSession[]>();
  sessions.forEach((session) => {
    const dateKey = getLocalDateKey(session.startDate);
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  });

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Check if date has sessions
  const getSessionsForDate = (date: Date): TrainingSession[] => {
    const dateKey = getLocalDateKey(date);
    return sessionsByDate.get(dateKey) || [];
  };

  // Check if date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    const dateKey = getLocalDateKey(date);
    return dateKey === selectedDate;
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const days = [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Day names header
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );

    // Empty cells for days before month starts
    const emptyCells = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      emptyCells.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Calendar days
    const calendarDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateSessions = getSessionsForDate(date);
      const hasSessions = dateSessions.length > 0;
      const past = isPastDate(date);
      const today = isToday(date);
      const selected = isSelected(date);

      calendarDays.push(
        <button
          key={day}
          onClick={() => {
            if (hasSessions && !past) {
              // Click the first available session
              const availableSession = dateSessions.find((s) => s.availableSpots > 0);
              if (availableSession) {
                onDateClick(availableSession);
              } else if (dateSessions.length > 0) {
                // If no available spots, still show the first session
                onDateClick(dateSessions[0]);
              }
            }
          }}
          disabled={!hasSessions || past}
          className={`
            aspect-square rounded-lg border-2 transition-all relative group
            ${past ? "opacity-40 cursor-not-allowed" : ""}
            ${today && !hasSessions ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}
            ${today && hasSessions && !selected ? "border-green-500 dark:border-green-500" : ""}
            ${selected && hasSessions ? "bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700" : ""}
            ${hasSessions && !past && !selected ? "hover:bg-green-500 dark:hover:bg-green-600 cursor-pointer border-green-300 dark:border-green-700" : ""}
            ${hasSessions && !past && selected ? "bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700" : ""}
            ${!hasSessions && !past ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700" : ""}
          `}
        >
          <div className="flex flex-col items-center justify-center h-full p-1">
            <span
              className={`
                text-sm font-medium transition-colors
                ${selected && hasSessions ? "text-white" : ""}
                ${hasSessions && !past && !selected ? "text-gray-900 dark:text-gray-100 group-hover:text-white" : ""}
                ${today && !hasSessions ? "text-blue-600 dark:text-blue-400" : ""}
                ${!hasSessions && !past ? "text-gray-900 dark:text-gray-100" : ""}
                ${past ? "text-gray-400 dark:text-gray-600" : ""}
              `}
            >
              {day}
            </span>
            {hasSessions && !past && (
              <div className={`flex gap-0.5 mt-0.5 transition-all duration-200 ${selected ? "opacity-80" : "opacity-100 group-hover:opacity-0"}`}>
                {dateSessions.slice(0, 3).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1 h-1 rounded-full transition-colors ${
                      selected ? "bg-white" : "bg-green-500 dark:bg-green-400"
                    }`}
                  />
                ))}
                {dateSessions.length > 3 && (
                  <span className={`text-[8px] font-semibold transition-colors ${
                    selected ? "text-white" : "text-green-600 dark:text-green-400"
                  }`}>
                    +{dateSessions.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </button>
      );
    }

    days.push(
      <div key="calendar" className="grid grid-cols-7 gap-1">
        {emptyCells}
        {calendarDays}
      </div>
    );

    return days;
  };

  const monthName = currentMonth.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {monthName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Hoje
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="p-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="p-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">{renderCalendarDays()}</div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20" />
              <span>Sessões disponíveis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20" />
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-200 dark:border-gray-700" />
              <span>Sem sessões</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

