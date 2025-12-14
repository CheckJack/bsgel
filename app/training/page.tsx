"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { HeroSlider } from "@/components/layout/hero-slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Calendar, Clock, MapPin, Users, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { TrainingCalendar } from "@/components/training/training-calendar";

interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  duration?: number;
  totalHours?: number;
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

interface BookingModalProps {
  session: TrainingSession | null;
  onClose: () => void;
  onBook: (sessionId: string, notes?: string) => Promise<void>;
}

function BookingModal({ session, onClose, onBook }: BookingModalProps) {
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    try {
      await onBook(session.id, notes);
      setNotes("");
      onClose();
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Book Training Session
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {session.program.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                €{session.program.price.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(session.startDate)} - {formatTime(session.endDate)}
                </span>
              </div>
              {session.location && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4" />
                  <span>{session.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4" />
                <span>
                  {session.availableSpots} of {session.maxParticipants} spots available
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requirements or questions..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isBooking}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrainingPage() {
  const { data: session } = useSession();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<TrainingSession[]>([]);

  useEffect(() => {
    fetchPrograms();
    // Don't fetch all sessions on initial load - wait for program selection
  }, []);

  useEffect(() => {
    // Auto-select the first program when programs are loaded
    if (programs.length > 0 && !selectedProgramId) {
      handleProgramSelect(programs[0].id);
    }
  }, [programs]);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/trainings");
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async (programId?: string) => {
    try {
      const params = new URLSearchParams();
      if (programId) {
        params.append("programId", programId);
      }
      const res = await fetch(`/api/trainings/sessions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched sessions:", data);
        setSessions(data);
      } else {
        const errorData = await res.json();
        console.error("Failed to fetch sessions:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedDate(null);
    setSelectedSession(null);
    fetchSessions(programId);
  };

  const handleDateClick = (clickedSession: TrainingSession) => {
    const dateKey = new Date(clickedSession.startDate).toISOString().split("T")[0];
    setSelectedDate(dateKey);
    
    // Get all sessions for this date
    const dateSessions = sessions.filter((s) => {
      const sDateKey = new Date(s.startDate).toISOString().split("T")[0];
      return sDateKey === dateKey;
    });
    setSessionsForSelectedDate(dateSessions);
    
    // Don't auto-select a session - let user choose from the right panel
    setSelectedSession(null);
  };

  const handleBookSession = async (sessionId: string, notes?: string) => {
    if (!session?.user) {
      toast("Please log in to book a training session", "error");
      return;
    }

    try {
      const res = await fetch("/api/trainings/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, notes }),
      });

      if (res.ok) {
        toast("Training session booked successfully!", "success");
        setSelectedSession(null);
        fetchSessions(selectedProgramId || undefined);
        fetchPrograms();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to book session", "error");
        throw new Error(data.error || "Failed to book session");
      }
    } catch (error: any) {
      if (!error.message.includes("Failed to book")) {
        toast("Failed to book session. Please try again.", "error");
      }
      throw error;
    }
  };

  const slides = [
    {
      type: "image" as const,
      src: "/Training_1.webp",
      title: "Biosculpture Training",
      description: "Professional training programs to advance your skills",
    },
  ];

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
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" />
      <div className="min-h-screen bg-brand-white">
        {/* Main Content Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-medium mb-4 text-brand-black">Training Programs</h2>
              <div className="w-24 h-1 bg-brand-champagne mx-auto mb-6"></div>
              <p className="text-lg font-light text-brand-black leading-relaxed max-w-3xl mx-auto">
                Advance your beauty career with our comprehensive training programs. 
                We offer world-class training across multiple locations to help you master 
                the art of Biosculpture nail care.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No training programs available at the moment. Please check back later.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="grid lg:grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                  {/* Left Side - Training Programs List */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Training Programs
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                      {programs.map((program) => (
                        <button
                          key={program.id}
                          onClick={() => handleProgramSelect(program.id)}
                          className={`
                            w-full flex gap-3 p-3 rounded-lg text-left transition-all
                            ${selectedProgramId === program.id
                              ? "border-2 border-brand-champagne"
                              : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }
                          `}
                        >
                          {program.image && (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={program.image}
                                alt={program.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                              {program.title}
                            </h3>
                            {program.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {program.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{program.totalHours || program.duration || 0}h</span>
                              </div>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                €{program.price.toFixed(2)}
                              </span>
                            </div>
                            {selectedProgramId === program.id && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  <span>{program.upcomingSessions} available session{program.upcomingSessions !== 1 ? "s" : ""}</span>
                                </div>
                                {program.includedProducts && program.includedProducts.length > 0 && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {program.includedProducts.length} product{program.includedProducts.length !== 1 ? "s" : ""} included
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Middle - Calendar */}
                  <div className="p-6">
                    {!selectedProgramId ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Select a training program to view available dates
                        </p>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No upcoming sessions for this program. Please check back later.
                        </p>
                      </div>
                    ) : (
                      <TrainingCalendar
                        sessions={sessions}
                        onDateClick={handleDateClick}
                        selectedDate={selectedDate}
                      />
                    )}
                  </div>

                  {/* Right Side - Available Times/Sessions */}
                  <div className="p-6">
                    {!selectedDate || sessionsForSelectedDate.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {!selectedProgramId 
                            ? "Select a training program"
                            : !selectedDate
                            ? "Click on a date to view available times"
                            : "No sessions available for this date"}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          Select a Date & Time
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {formatDate(sessionsForSelectedDate[0].startDate)}
                        </p>
                        
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                          {sessionsForSelectedDate.map((sessionItem) => (
                            <button
                              key={sessionItem.id}
                              onClick={() => {
                                if (sessionItem.availableSpots > 0) {
                                  if (session?.user) {
                                    setSelectedSession(sessionItem);
                                  }
                                }
                              }}
                              disabled={sessionItem.availableSpots === 0}
                              className={`
                                w-full p-3 rounded-lg border-2 text-left transition-all
                                ${sessionItem.availableSpots === 0
                                  ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed"
                                  : selectedSession?.id === sessionItem.id
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/10 cursor-pointer"
                                }
                              `}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                  {formatTime(sessionItem.startDate)} - {formatTime(sessionItem.endDate)}
                                </span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  €{sessionItem.program.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                {sessionItem.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {sessionItem.location}
                                  </span>
                                )}
                                {sessionItem.format && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                    {sessionItem.format === "ONLINE" ? "Online" : sessionItem.format === "PRESENTIAL" ? "In-Person" : "Hybrid"}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {sessionItem.availableSpots} spots
                                </span>
                              </div>
                              {sessionItem.availableSpots === 0 && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Fully booked
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                        {!session?.user && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Link href="/login" className="block">
                              <Button className="w-full" variant="outline" size="sm">
                                Log in to Book
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Booking Modal */}
      {selectedSession && (
        <BookingModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onBook={handleBookSession}
        />
      )}
    </>
  );
}

