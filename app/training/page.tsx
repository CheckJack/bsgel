"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Calendar, Clock, MapPin, Users, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { TrainingCalendar } from "@/components/training/training-calendar";
import { useLanguage } from "@/contexts/language-context";
import TestimonialV2 from "@/components/ui/testimonial-v2";

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
  const { t } = useLanguage();
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
              {t("training.bookTrainingSession")}
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
                  {session.availableSpots} de {session.maxParticipants} {t("training.spots")} disponíveis
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
                {t("training.additionalNotes")}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("training.additionalNotesPlaceholder")}
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
                {t("training.cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("training.booking")}
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t("training.confirmBooking")}
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
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<TrainingSession[]>([]);
  const [nextAvailableSessions, setNextAvailableSessions] = useState<TrainingSession[]>([]);
  const [showNextDatesNotice, setShowNextDatesNotice] = useState(true);
  const [nextDatesTop, setNextDatesTop] = useState<number | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const nextDatesNoticeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchNextAvailableSessions();
    // Don't fetch all sessions on initial load - wait for program selection
  }, []);

  useEffect(() => {
    const updateNoticePosition = () => {
      if (!heroSectionRef.current || !nextDatesNoticeRef.current) return;
      const heroRect = heroSectionRef.current.getBoundingClientRect();
      const noticeHeight = nextDatesNoticeRef.current.offsetHeight;
      setNextDatesTop(heroRect.top + heroRect.height / 2 - noticeHeight / 2 - 106);
    };

    updateNoticePosition();
    window.addEventListener("resize", updateNoticePosition);

    return () => {
      window.removeEventListener("resize", updateNoticePosition);
    };
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

  const fetchNextAvailableSessions = async () => {
    try {
      const res = await fetch("/api/trainings/sessions");
      if (res.ok) {
        const data: TrainingSession[] = await res.json();
        setNextAvailableSessions(data.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch next available sessions:", error);
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
      toast(t("training.pleaseLogin"), "error");
      return;
    }

    try {
      const res = await fetch("/api/trainings/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, notes }),
      });

      if (res.ok) {
        toast(t("training.bookedSuccessfully"), "success");
        setSelectedSession(null);
        fetchSessions(selectedProgramId || undefined);
        fetchPrograms();
      } else {
        const data = await res.json();
        toast(data.error || t("training.failedToBook"), "error");
        throw new Error(data.error || t("training.failedToBook"));
      }
    } catch (error: any) {
      if (!error.message.includes("Failed to book")) {
        toast(t("training.failedToBook"), "error");
      }
      throw error;
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
    <>
      {showNextDatesNotice && (
        <aside
          ref={nextDatesNoticeRef}
          className="fixed right-2 z-40 w-[215px] rounded-md border border-gray-200 bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:right-5 md:w-[250px] md:p-2"
          style={{ top: nextDatesTop ? `${nextDatesTop}px` : undefined }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <p className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.1em] text-gray-700">
              <Calendar className="h-3 w-3 text-brand-champagne" />
              Próximas datas
            </p>
            <button
              type="button"
              onClick={() => setShowNextDatesNotice(false)}
              className="rounded p-0.5 text-sm leading-none text-gray-400 transition-colors hover:text-gray-700"
              aria-label="Fechar notificação de próximas datas"
            >
              ×
            </button>
          </div>
          <div className="mt-1.5 space-y-1">
            {nextAvailableSessions.length > 0 ? (
              nextAvailableSessions.map((sessionItem, idx) => (
                <Link
                  key={sessionItem.id}
                  href={`/training/${sessionItem.programId}`}
                  className={`group rounded-md border border-gray-200 bg-white p-1.5 transition-all hover:border-brand-champagne/60 hover:bg-brand-champagne/[0.04] ${idx === 2 ? "hidden md:block" : "block"}`}
                >
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-brand-black [text-wrap:balance]">
                    {sessionItem.program.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-700">
                    {new Date(sessionItem.startDate).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gray-600">
                    <Users className="h-3 w-3" />
                    {sessionItem.availableSpots} vagas
                  </p>
                  <div className="mt-0.5 max-h-0 overflow-hidden border-t border-transparent opacity-0 transition-all duration-200 group-hover:mt-1.5 group-hover:max-h-24 group-hover:border-gray-100 group-hover:pt-1.5 group-hover:opacity-100">
                    <p className="inline-flex items-center gap-1 text-[10px] text-gray-600">
                      <Clock className="h-3 w-3" />
                      {new Date(sessionItem.startDate).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                      {" - "}
                      {new Date(sessionItem.endDate).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {sessionItem.location || "Local a confirmar"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-brand-champagne">
                      {sessionItem.format === "ONLINE"
                        ? "Online"
                        : sessionItem.format === "HYBRID"
                          ? "Híbrido"
                          : "Presencial"}{" "}
                      • Clique para reservar
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm font-light text-gray-600">
                Sem datas disponíveis de momento.
              </p>
            )}
          </div>
        </aside>
      )}

      <section ref={heroSectionRef} className="relative h-[36vh] w-full overflow-hidden md:h-[44vh]">
        <Image
          src="/training-hero-custom.png"
          alt={t("training.title")}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto flex h-full max-w-7xl items-center px-4">
            <h1 className="text-4xl font-medium text-white sm:text-5xl md:text-6xl">
              {t("training.title")}
            </h1>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div className="flex min-h-[320px] flex-col justify-center rounded-lg bg-white p-4 md:min-h-[380px] md:p-6 lg:min-h-[420px]">
              <h2 className="mb-4 text-3xl font-light tracking-tight text-brand-black md:text-4xl">
                Torne-se Terapeuta de unhas Bio
              </h2>
              <p className="text-lg font-light leading-relaxed text-brand-black md:text-2xl">
                {t("training.upgradeParagraph1")}
              </p>
              <p className="mt-4 text-lg font-light leading-relaxed text-brand-black md:text-2xl">
                {t("training.upgradeParagraph2")}
              </p>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-lg md:min-h-[380px] lg:min-h-[420px]">
              <Image
                src="/training-detail-custom.png"
                alt="Formação BIO Sculpture"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full h-[420px] sm:h-[520px] md:h-[620px] overflow-hidden">
        <Image
          src="/training-benefits-bg-custom.png"
          alt="Training background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <div className="grid w-full max-w-5xl grid-cols-1 justify-items-center gap-4 sm:grid-cols-3 sm:gap-4">
            <div className="flex h-[175px] w-[245px] flex-col items-center justify-center border border-white/60 px-4 text-center sm:h-[195px] sm:w-[270px]">
              <img
                src="/training-benefit-recognized-custom.png"
                alt="Reconhecida internacionalmente"
                className="h-14 w-auto sm:h-16"
              />
              <p className="mt-3 text-xs font-medium leading-tight tracking-wide text-white sm:text-sm">
                RECONHECIDA INTERNACIONALMENTE
              </p>
            </div>
            <div className="flex h-[175px] w-[245px] flex-col items-center justify-center border border-white/60 px-4 text-center sm:h-[195px] sm:w-[270px]">
              <img
                src="/training-benefit-distinction-custom.png"
                alt="Formação com distinção"
                className="h-14 w-auto sm:h-16"
              />
              <p className="mt-3 text-xs font-medium leading-tight tracking-wide text-white sm:text-sm">
                FORMAÇÃO COM DISTINÇÃO
              </p>
            </div>
            <div className="flex h-[175px] w-[245px] flex-col items-center justify-center border border-white/60 px-4 text-center sm:h-[195px] sm:w-[270px]">
              <img
                src="/training-benefit-certificate-custom.png"
                alt="Formação com certificado profissional"
                className="h-14 w-auto sm:h-16"
              />
              <p className="mt-3 text-xs font-medium leading-tight tracking-wide text-white sm:text-sm">
                FORMAÇÃO COM CERTIFICADO PROFISSIONAL
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-4xl font-light tracking-tight text-brand-black md:text-5xl">
            Torna-se na Especialista Mais Requisitada
            <br />
            em Tratamento de Unhas
          </h2>
          <p className="mx-auto mt-6 whitespace-pre-line text-left text-base font-light leading-relaxed text-brand-black md:text-lg">
            {`A Formação BIO Sculpture proporciona conhecimentos mais avançados em relação aos cuidados das unhas através da aplicação de produtos e protocolos específicos.

Essa especialização permite que o profissional domine técnicas personalizadas para cada cliente consoante o tipo, condição da unha e estilo de vida cliente. Além disso, a formação BIO Sculpture também aborda técnicas de limagem, extensões, entre outras, de forma mais abrangente.

Ao se tornar um Terapeuta de unhas BIO, e implementando o CONCEITO BIO, amplia os seus serviços, podendo oferecer tratamentos mais abrangentes e específicos para as unhas das suas clientes.

Enquanto uma técnica de unhas comum foca principalmente na aplicação de unhas artificiais e na sua manutenção, uma Terapeuta de unhas BIO está apto a realizar tratamentos para melhorar a saúde das unhas naturais, diagnosticar problemas específicos e fornecer soluções adequadas.`}
          </p>
        </div>
      </section>

      <section className="relative w-full h-[300px] sm:h-[380px] md:h-[460px] overflow-hidden">
        <Image
          src="/training-banner-primeiro-custom.png"
          alt="Primeiro tratar e depois embelezar"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <h2 className="text-center text-3xl font-medium text-white md:text-5xl">
            Primeiro tratar e depois embelezar
          </h2>
        </div>
      </section>

      <section className="w-full bg-white pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-left text-4xl font-light tracking-tight text-brand-black md:text-5xl">
            Pronta para dar o próximo passo?
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <Image
                  src="/training-card-1-custom.png"
                  alt="Formação on-line e presencial"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-left text-sm font-light leading-relaxed text-brand-black">
                {`Formação on-line e/ou presencial consoante a sua necessidade, cursos e workshops para profissionais e iniciantes.`}
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <Image
                  src="/training-card-2-custom.png"
                  alt="Apoio técnico contínuo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-left text-sm font-light leading-relaxed text-brand-black">
                {`A sua formação não termina aqui: o apoio técnico, continua, tire sempre as suas duvidas connosco.`}
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <Image
                  src="/training-card-3-custom.png"
                  alt="Workshops gratuitos"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-left text-sm font-light leading-relaxed text-brand-black">
                {`Workshops gratuitos para formandas BIO Sculpture, refresh e aumento de conhecimentos.`}
              </p>
            </article>

            <article className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <Image
                  src="/training-card-4-custom.png"
                  alt="Cursos certificados pela plataforma SIGO"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-4 whitespace-pre-line text-left text-sm font-light leading-relaxed text-brand-black">
                {`Cursos certificados pela plataforma SIGO, para emissão de Certificado Profissional, mais certificado internacional da marca`}
              </p>
            </article>
          </div>
        </div>
      </section>
      
      <div className="min-h-screen bg-brand-white">
        {/* Main Content Section */}
        <section id="programas-formacao" className="py-8 md:py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="mb-3 text-4xl font-light tracking-tight text-brand-black md:text-5xl">{t("training.trainingPrograms")}</h2>
              <div className="w-24 h-1 bg-brand-champagne mx-auto mb-4"></div>
              <p className="text-base md:text-lg font-light text-brand-black leading-relaxed max-w-3xl mx-auto">
                {t("training.trainingProgramsDesc")}
              </p>
            </div>

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : programs.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">{t("training.noTrainingPrograms")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`/training/${program.id}`}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                      {program.image ? (
                        <img
                          src={program.image}
                          alt={program.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <h3 className="line-clamp-2 text-lg font-semibold text-brand-black">{program.title}</h3>
                      {program.description && (
                        <p className="line-clamp-3 text-sm leading-relaxed text-gray-700">{program.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {program.totalHours || program.duration || 0}h
                        </span>
                        <span className="font-semibold text-brand-black">€{program.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <TestimonialV2 />
      </div>
    </>
  );
}

