"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrainingCalendar } from "@/components/training/training-calendar";
import { TrainingSessionChoiceModal } from "@/components/training/training-session-choice-modal";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

function getStickTop() {
  const headerVar = getComputedStyle(document.documentElement).getPropertyValue(
    "--site-header-height"
  );
  return (parseFloat(headerVar) || 113) + 20;
}

interface TrainingSession {
  id: string;
  startDate: string;
  endDate: string;
  location: string | null;
  maxParticipants: number;
  availableSpots: number;
  currentBookings: number;
}

interface TrainingDay {
  day: number;
  hours: number;
  content?: string;
  format?: "ONLINE" | "PRESENTIAL" | "HYBRID";
}

interface IncludedProduct {
  id: string;
  name: string;
  image: string | null;
  quantity: number;
}

interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  days?: TrainingDay[] | null;
  totalHours?: number;
  price: number;
  image: string | null;
  openBooking?: boolean;
  sessions: TrainingSession[];
  includedProducts?: IncludedProduct[];
}

const getLocalDateKey = (value: string | Date) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TrainingProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const { refreshCart } = useCart();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessionsForDate, setSessionsForDate] = useState<TrainingSession[]>([]);
  const [pendingSession, setPendingSession] = useState<TrainingSession | null>(null);
  const [pendingOpenDate, setPendingOpenDate] = useState<string | null>(null);
  const [isSubmittingChoice, setIsSubmittingChoice] = useState(false);

  const leftColRef = useRef<HTMLDivElement>(null);
  const bookingColRef = useRef<HTMLDivElement>(null);
  const bookingPanelRef = useRef<HTMLDivElement>(null);
  const [pinMode, setPinMode] = useState<"static" | "fixed" | "absolute">("static");
  const [fixedPin, setFixedPin] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const [absoluteTop, setAbsoluteTop] = useState(0);
  const [columnHeight, setColumnHeight] = useState(0);
  const [panelHeight, setPanelHeight] = useState(0);

  const locale = language === "pt" ? "pt-PT" : "en-GB";

  const updateBookingPin = useCallback(() => {
    // Match the xl two-column layout; below that the calendar stacks normally.
    const isXl = window.matchMedia("(min-width: 1280px)").matches;
    const left = leftColRef.current;
    const column = bookingColRef.current;
    const panel = bookingPanelRef.current;

    if (!isXl || !left || !column || !panel) {
      setPinMode("static");
      setFixedPin(null);
      setColumnHeight(0);
      setPanelHeight(0);
      return;
    }

    const stickTop = getStickTop();
    const viewH = Math.max(0, window.innerHeight - stickTop);
    const leftH = left.offsetHeight;
    const panH = panel.offsetHeight;
    const colH = Math.max(leftH, panH);

    setColumnHeight(colH);
    setPanelHeight(panH);

    const leftRect = left.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();
    const scrollY = window.scrollY;

    const leftTopPage = scrollY + leftRect.top;
    const leftBottomPage = scrollY + leftRect.bottom;

    const pinStart = leftTopPage - stickTop;
    const pinEnd = leftBottomPage - stickTop - Math.min(panH, viewH);

    if (scrollY < pinStart || pinEnd <= pinStart) {
      if (scrollY < pinStart) {
        setPinMode("static");
        setFixedPin(null);
      } else {
        setPinMode("absolute");
        setFixedPin(null);
        setAbsoluteTop(Math.max(0, colH - panH));
      }
      return;
    }

    if (scrollY < pinEnd) {
      setPinMode("fixed");
      setFixedPin({
        top: stickTop,
        left: columnRect.left,
        width: columnRect.width,
      });
      return;
    }

    setPinMode("absolute");
    setFixedPin(null);
    setAbsoluteTop(Math.max(0, colH - panH));
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateBookingPin);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const mq = window.matchMedia("(min-width: 1280px)");
    mq.addEventListener("change", schedule);

    const ro = new ResizeObserver(schedule);
    if (leftColRef.current) ro.observe(leftColRef.current);
    if (bookingPanelRef.current) ro.observe(bookingPanelRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mq.removeEventListener("change", schedule);
      ro.disconnect();
    };
  }, [updateBookingPin, program, selectedDate, sessionsForDate]);

  useEffect(() => {
    const fetchProgram = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trainings/${params.id}`);
        if (!res.ok) {
          throw new Error("Programa não encontrado.");
        }
        const data = await res.json();
        setProgram(data);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar o programa.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgram();
  }, [params.id]);

  const sortedDays = useMemo(
    () =>
      Array.isArray(program?.days)
        ? [...program.days].sort((a, b) => (a.day || 0) - (b.day || 0))
        : [],
    [program?.days]
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const reserveSessionAndAddToCart = async (sessionItem: TrainingSession) => {
    const res = await fetch(`/api/trainings/sessions/${sessionItem.id}/reserve`, {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || t("training.failedToBook"));
    }

    await refreshCart();
    return data as { itemsAdded?: number; skippedProducts?: Array<{ productId: string; reason: string }> };
  };

  const reserveOpenDateAndAddToCart = async (dateKey: string) => {
    const res = await fetch(`/api/trainings/${params.id}/reserve-date`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || t("training.failedToBook"));
    }

    await refreshCart();
    return data;
  };

  const handleSessionSelect = (sessionItem: TrainingSession) => {
    if (sessionItem.availableSpots <= 0) {
      toast(t("training.sessionFull"), "error");
      return;
    }

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/training/${params.id}`)}`);
      return;
    }

    setPendingOpenDate(null);
    setPendingSession(sessionItem);
  };

  const handleOpenDateSelect = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSessionsForDate([]);

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/training/${params.id}`)}`);
      return;
    }

    setPendingSession(null);
    setPendingOpenDate(dateKey);
  };

  const closeChoiceModal = () => {
    if (isSubmittingChoice) return;
    setPendingSession(null);
    setPendingOpenDate(null);
  };

  const handleContinueShopping = async () => {
    if (!pendingSession && !pendingOpenDate) return;

    setIsSubmittingChoice(true);
    try {
      if (pendingOpenDate) {
        await reserveOpenDateAndAddToCart(pendingOpenDate);
      } else if (pendingSession) {
        await reserveSessionAndAddToCart(pendingSession);
      }
      toast(t("training.addedToCartContinue"), "success");
      setPendingSession(null);
      setPendingOpenDate(null);
      window.dispatchEvent(new CustomEvent("openCartDrawer"));
    } catch (err: any) {
      toast(err?.message || t("training.failedToBook"), "error");
    } finally {
      setIsSubmittingChoice(false);
    }
  };

  const handleCheckout = async () => {
    if (!pendingSession && !pendingOpenDate) return;

    setIsSubmittingChoice(true);
    try {
      if (pendingOpenDate) {
        await reserveOpenDateAndAddToCart(pendingOpenDate);
      } else if (pendingSession) {
        await reserveSessionAndAddToCart(pendingSession);
      }
      setPendingSession(null);
      setPendingOpenDate(null);
      router.push("/checkout");
    } catch (err: any) {
      toast(err?.message || t("training.failedToBook"), "error");
    } finally {
      setIsSubmittingChoice(false);
    }
  };

  const handleDateClick = (sessionItem: TrainingSession) => {
    const key = getLocalDateKey(sessionItem.startDate);
    setSelectedDate(key);
    const sameDay = (program?.sessions || []).filter(
      (s) => getLocalDateKey(s.startDate) === key
    );
    setSessionsForDate(sameDay);
  };

  const handleBackToCalendar = () => {
    setSelectedDate(null);
    setSessionsForDate([]);
  };

  const formatDateKeyLabel = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return <main className="min-h-screen bg-white p-6">{t("training.loading")}</main>;
  }

  if (error || !program) {
    return <main className="min-h-screen bg-white p-6">{error || "Erro"}</main>;
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="px-4 py-6 sm:py-8 md:py-12">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/training#programas-formacao"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-black hover:text-brand-champagne"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos programas
          </Link>

          <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div ref={leftColRef} className="space-y-6">
              <div className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-[240px_1fr]">
                <div>
                  {program.image ? (
                    <img
                      src={program.image}
                      alt={program.title}
                      className="h-52 w-full rounded-xl object-cover sm:h-64 lg:h-full"
                    />
                  ) : (
                    <div className="h-52 w-full rounded-xl bg-gray-200 sm:h-64 lg:h-full" />
                  )}
                </div>
                <div>
                  <h1 className="mb-3 font-display text-2xl font-normal tracking-tight text-brand-black sm:text-3xl md:text-4xl">
                    {program.title}
                  </h1>
                  {program.description && (
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                      {program.description}
                    </p>
                  )}
                </div>
              </div>

              {program.content && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                    {program.content}
                  </p>
                </div>
              )}

              {sortedDays.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-display text-xl font-normal tracking-tight text-brand-black">Dias de Formação</h2>
                  <div className="space-y-4">
                    {sortedDays.map((trainingDay, idx) => (
                      <div
                        key={`${trainingDay.day}-${idx}`}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-brand-champagne/20 px-3 py-1 text-xs font-semibold text-brand-black">
                            Dia {trainingDay.day}
                          </span>
                          <span className="text-sm text-gray-700">{trainingDay.hours || 0}h</span>
                        </div>
                        {trainingDay.content && (
                          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                            {trainingDay.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(program.includedProducts) && program.includedProducts.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-display text-xl font-normal tracking-tight text-brand-black">Produtos incluídos</h2>
                  <div className="space-y-3">
                    {program.includedProducts.map((includedProduct) => (
                      <div
                        key={includedProduct.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        {includedProduct.image ? (
                          <img
                            src={includedProduct.image}
                            alt={includedProduct.name}
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
                            Sem imagem
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{includedProduct.name}</p>
                        </div>
                        <span className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
                          x{includedProduct.quantity || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              ref={bookingColRef}
              className="relative min-w-0"
              style={
                columnHeight > 0 && pinMode !== "static"
                  ? { minHeight: columnHeight }
                  : undefined
              }
            >
              {pinMode === "fixed" && panelHeight > 0 ? (
                <div aria-hidden className="invisible" style={{ height: panelHeight }} />
              ) : null}
              <div
                ref={bookingPanelRef}
                className={cn(
                  "overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg",
                  pinMode === "fixed" && "xl:fixed xl:z-20",
                  pinMode === "absolute" && "xl:absolute xl:left-0 xl:right-0 xl:z-10"
                )}
                style={
                  pinMode === "fixed" && fixedPin
                    ? {
                        top: fixedPin.top,
                        left: fixedPin.left,
                        width: fixedPin.width,
                      }
                    : pinMode === "absolute"
                      ? { top: absoluteTop }
                      : undefined
                }
              >
                {program.openBooking ? (
                  <div className="p-6">
                    <p className="mb-4 text-sm text-gray-600">
                      {t("training.openBookingHint")}
                    </p>
                    <TrainingCalendar
                      sessions={(program.sessions as any) || []}
                      onDateClick={handleDateClick as any}
                      onOpenDateClick={handleOpenDateSelect}
                      openBooking
                      selectedDate={selectedDate}
                    />
                  </div>
                ) : !selectedDate ? (
                  <div className="p-6">
                    <TrainingCalendar
                      sessions={(program.sessions as any) || []}
                      onDateClick={handleDateClick as any}
                      selectedDate={selectedDate}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToCalendar}
                      className="mb-4 inline-flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar ao calendário
                    </Button>

                    <h3 className="text-base font-semibold text-brand-black">Selecione uma Data e Hora</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      {sessionsForDate[0] ? formatDate(sessionsForDate[0].startDate) : ""}
                    </p>

                    <div className="max-h-[300px] space-y-3 overflow-y-auto sm:max-h-[360px]">
                      {sessionsForDate.map((sessionItem) => {
                        const isFull = sessionItem.availableSpots <= 0;

                        return (
                          <button
                            key={sessionItem.id}
                            type="button"
                            disabled={isFull || isSubmittingChoice}
                            onClick={() => handleSessionSelect(sessionItem)}
                            className={cn(
                              "w-full rounded-lg border p-3 text-left transition-colors",
                              isFull
                                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                                : "border-gray-200 bg-white hover:border-brand-champagne/50 hover:bg-brand-sweet-bianca/20"
                            )}
                          >
                            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {formatTime(sessionItem.startDate)} - {formatTime(sessionItem.endDate)}
                              </span>
                              <span className="text-sm font-medium text-brand-black">
                                €{program.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                              {sessionItem.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {sessionItem.location}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {sessionItem.availableSpots} {t("training.spots")}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(pendingSession || pendingOpenDate) && program && (
        <TrainingSessionChoiceModal
          open={Boolean(pendingSession || pendingOpenDate)}
          onClose={closeChoiceModal}
          onCheckout={handleCheckout}
          onContinueShopping={handleContinueShopping}
          isSubmitting={isSubmittingChoice}
          programTitle={program.title}
          price={program.price}
          startLabel={
            pendingOpenDate
              ? formatDateKeyLabel(pendingOpenDate)
              : pendingSession
                ? formatTime(pendingSession.startDate)
                : ""
          }
          endLabel={
            pendingOpenDate
              ? t("training.online")
              : pendingSession
                ? formatTime(pendingSession.endDate)
                : ""
          }
          location={
            pendingOpenDate
              ? t("training.online")
              : pendingSession?.location || null
          }
        />
      )}
    </main>
  );
}
