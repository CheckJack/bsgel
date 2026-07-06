"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Loader2, MapPin, Users, ArrowRight } from "lucide-react";
import mobileTrainingHero from "../../egw2.png";
import { useLanguage } from "@/contexts/language-context";
import TestimonialV2 from "@/components/ui/testimonial-v2";
import { cn } from "@/lib/utils";

interface TrainingDay {
  day: number;
  hours: number;
}

interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  days?: TrainingDay[] | null;
  totalHours?: number;
  duration?: number;
  price: number;
  image: string | null;
  upcomingSessions: number;
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
  availableSpots: number;
  maxParticipants: number;
}

type ProgramAudience = "professional" | "beginner" | "workshop" | "general";
type ProgramFilter = "all" | "professional" | "beginner" | "workshop";

function inferProgramAudience(program: TrainingProgram): ProgramAudience {
  const title = program.title.toLowerCase();
  if (title.includes("workshop") || title.includes("refresh")) return "workshop";
  if (
    title.includes("iniciante") ||
    title.includes("beginner") ||
    title.includes("5 dia") ||
    title.includes("5-day")
  ) {
    return "beginner";
  }
  if (
    title.includes("profissional") ||
    title.includes("professional") ||
    title.includes("2 dia") ||
    title.includes("2-day")
  ) {
    return "professional";
  }
  const dayCount = Array.isArray(program.days) ? program.days.length : 0;
  if (dayCount >= 5) return "beginner";
  if (dayCount >= 2 && dayCount <= 3) return "professional";
  return "general";
}

const FILTER_TABS: ProgramFilter[] = ["all", "professional", "beginner", "workshop"];

export default function TrainingPage() {
  const { t, language } = useLanguage();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState<ProgramFilter>("all");

  const locale = language === "pt" ? "pt-PT" : "en-GB";

  useEffect(() => {
    const load = async () => {
      try {
        const [programsRes, sessionsRes] = await Promise.all([
          fetch("/api/trainings"),
          fetch("/api/trainings/sessions"),
        ]);
        if (programsRes.ok) {
          setPrograms(await programsRes.json());
        }
        if (sessionsRes.ok) {
          const sessions: TrainingSession[] = await sessionsRes.json();
          setUpcomingSessions(sessions.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch training data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredPrograms = useMemo(() => {
    if (programFilter === "all") return programs;
    return programs.filter((p) => inferProgramAudience(p) === programFilter);
  }, [programs, programFilter]);

  const nextSessionByProgram = useMemo(() => {
    const map = new Map<string, TrainingSession>();
    for (const session of upcomingSessions) {
      if (!map.has(session.programId)) {
        map.set(session.programId, session);
      }
    }
    return map;
  }, [upcomingSessions]);

  const scrollToPrograms = (filter?: ProgramFilter) => {
    if (filter) setProgramFilter(filter);
    document.getElementById("programas-formacao")?.scrollIntoView({ behavior: "smooth" });
  };

  const formatSessionDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatSessionTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const formatLabel = (format?: TrainingSession["format"]) => {
    if (format === "ONLINE") return t("training.online");
    if (format === "HYBRID") return t("training.hybrid");
    return t("training.inPerson");
  };

  const filterLabel = (filter: ProgramFilter) => {
    switch (filter) {
      case "professional":
        return t("training.filterProfessional");
      case "beginner":
        return t("training.filterBeginner");
      case "workshop":
        return t("training.filterWorkshop");
      default:
        return t("training.filterAll");
    }
  };

  const includedItems = [
    {
      title: t("training.includedItem1Title"),
      desc: t("training.includedItem1Desc"),
      image: "/training-card-1-custom.png",
    },
    {
      title: t("training.includedItem2Title"),
      desc: t("training.includedItem2Desc"),
      image: "/training-card-2-custom.png",
    },
    {
      title: t("training.includedItem3Title"),
      desc: t("training.includedItem3Desc"),
      image: "/training-card-3-custom.png",
    },
    {
      title: t("training.includedItem4Title"),
      desc: t("training.includedItem4Desc"),
      image: "/training-card-4-custom.png",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* 1. Purpose-led hero */}
      <section className="w-full bg-brand-white min-h-[calc(100dvh-var(--site-header-height,113px))]">
        <div className="grid h-[calc(100dvh-var(--site-header-height,113px))] min-h-[calc(100dvh-var(--site-header-height,113px))] grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
          <div className="flex h-full flex-col justify-center px-6 py-12 sm:px-10 md:px-12 lg:px-14 lg:py-16 xl:px-20">
            <p className="font-header text-[11px] uppercase tracking-[0.16em] text-brand-black/55 sm:text-xs">
              {t("training.heroEyebrow")}
            </p>
            <h1 className="mt-3 font-display text-[2.35rem] font-normal leading-[1.02] tracking-tight text-brand-black sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem]">
              {t("training.heroTitle")}
            </h1>
            <p className="mt-5 font-header text-sm leading-relaxed text-brand-black/70 sm:mt-6 sm:text-base">
              {t("training.description")}
            </p>
            <p className="mt-4 font-header text-sm leading-relaxed text-brand-black/70 sm:text-base">
              {t("training.upgradeParagraph1")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => scrollToPrograms()}
                className="font-header inline-flex min-h-12 items-center justify-center rounded-full bg-brand-black px-8 text-sm uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-brand-champagne-dark sm:min-h-[3.25rem] sm:text-[13px]"
              >
                {t("training.viewPrograms")}
              </button>
              <Link
                href="/contact"
                className="font-header inline-flex min-h-12 items-center justify-center rounded-full border border-brand-black px-8 text-sm uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-brand-black hover:text-brand-white sm:min-h-[3.25rem] sm:text-[13px]"
              >
                {t("training.contactUs")}
              </Link>
            </div>
          </div>
          <div className="relative min-h-[16rem] h-full w-full lg:min-h-0">
            <Image
              src={mobileTrainingHero}
              alt={t("training.title")}
              fill
              className="object-cover lg:hidden"
              priority
              unoptimized
            />
            <Image
              src="/training-hero-custom.png"
              alt={t("training.title")}
              fill
              sizes="50vw"
              className="hidden object-cover lg:block"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* 2. Programs catalog */}
      <section id="programas-formacao" className="w-full scroll-mt-28 bg-brand-white px-[5%] py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-normal tracking-tight text-brand-black md:text-5xl">
              {t("training.trainingPrograms")}
            </h2>
            <div className="mx-auto mt-4 h-1 w-24 bg-brand-champagne" />
            <p className="mx-auto mt-4 max-w-3xl font-header text-sm leading-relaxed text-brand-black/70 sm:text-base">
              {t("training.trainingProgramsDesc")}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {FILTER_TABS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setProgramFilter(filter)}
                className={cn(
                  "font-header rounded-full border px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors",
                  programFilter === filter
                    ? "border-brand-black bg-brand-black text-white"
                    : "border-black/15 text-brand-black hover:border-brand-champagne hover:text-brand-champagne-dark"
                )}
              >
                {filterLabel(filter)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-gray-400" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-header text-brand-black/60">{t("training.noTrainingPrograms")}</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program) => {
                const nextSession = nextSessionByProgram.get(program.id);
                const audience = inferProgramAudience(program);
                return (
                  <Link
                    key={program.id}
                    href={`/training/${program.id}`}
                    className="group overflow-hidden rounded-xl border border-black/10 bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                      {program.image ? (
                        <img
                          src={program.image}
                          alt={program.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-header text-sm text-gray-500">
                          {t("training.noImage")}
                        </div>
                      )}
                      {audience !== "general" && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-header text-[10px] uppercase tracking-[0.1em] text-brand-black">
                          {filterLabel(audience as ProgramFilter)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <h3 className="line-clamp-2 font-display text-lg font-normal tracking-tight text-brand-black">
                        {program.title}
                      </h3>
                      {program.description && (
                        <p className="line-clamp-3 font-header text-sm leading-relaxed text-brand-black/70">
                          {program.description}
                        </p>
                      )}
                      {nextSession && (
                        <p className="inline-flex items-center gap-1.5 font-header text-xs text-brand-champagne-dark">
                          <Calendar className="size-3.5" />
                          {t("training.nextDate")}: {formatSessionDate(nextSession.startDate)}
                        </p>
                      )}
                      <div className="flex items-center justify-between border-t border-black/5 pt-3 font-header text-sm text-brand-black/80">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-4" />
                          {program.totalHours || program.duration || 0}h
                        </span>
                        <span className="font-medium text-brand-black">€{program.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. Upcoming dates */}
      <section className="w-full bg-pink-900 px-[5%] py-10 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-header text-[11px] uppercase tracking-[0.16em] text-white/70">
                {t("training.upcomingDatesTitle")}
              </p>
              <h2 className="mt-1 font-display text-2xl font-normal tracking-tight text-white md:text-3xl">
                {t("training.upcomingDatesDesc")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => scrollToPrograms()}
              className="font-header text-xs uppercase tracking-[0.14em] text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              {t("training.viewPrograms")}
            </button>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {upcomingSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/training/${session.programId}`}
                  className="group rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <p className="line-clamp-2 font-header text-sm font-medium leading-snug text-white">
                    {session.program.title}
                  </p>
                  <p className="mt-2 font-header text-xs text-white/85">
                    {formatSessionDate(session.startDate)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 font-header text-[11px] text-white/70">
                    <Users className="size-3" />
                    {session.availableSpots} {t("training.spots")}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 font-header text-[11px] text-white/70">
                    <Clock className="size-3" />
                    {formatSessionTime(session.startDate)} – {formatSessionTime(session.endDate)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 font-header text-[11px] text-white/70">
                    <MapPin className="size-3" />
                    {session.location || t("training.locationTbc")}
                  </p>
                  <p className="mt-2 font-header text-[11px] font-medium text-white/90">
                    {formatLabel(session.format)} · {t("training.clickToBook")}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-header text-sm text-white/80">{t("training.noUpcomingDatesInline")}</p>
          )}
        </div>
      </section>

      {/* 4. Why BIO — consolidated */}
      <section className="w-full bg-white px-[5%] py-12 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="font-display text-3xl font-normal tracking-tight text-brand-black md:text-4xl">
              {t("training.whyBioTitle")}
            </h2>
            <ul className="mt-6 space-y-4">
              {[t("training.whyBioBullet1"), t("training.whyBioBullet2"), t("training.whyBioBullet3")].map(
                (bullet) => (
                  <li key={bullet} className="flex items-start gap-3 font-header text-sm leading-relaxed text-brand-black/80 sm:text-base">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-champagne" />
                    {bullet}
                  </li>
                )
              )}
            </ul>
            <details className="mt-6 group">
              <summary className="cursor-pointer font-header text-sm uppercase tracking-[0.12em] text-brand-champagne-dark marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  {t("training.whyBioExpandLabel")}
                  <ArrowRight className="size-3.5 transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-4 whitespace-pre-line font-header text-sm leading-relaxed text-brand-black/70 sm:text-base">
                {t("training.whyBioExpandContent")}
              </p>
            </details>
          </div>
          <div className="relative min-h-[20rem] overflow-hidden rounded-lg sm:min-h-[24rem] lg:min-h-[28rem]">
            <Image
              src="/training-detail-custom.png"
              alt={t("training.title")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* 5. Credentials bar */}
      <section className="relative h-[420px] w-full overflow-hidden sm:h-[520px] md:h-[620px]">
        <Image
          src="/training-benefits-bg-custom.png"
          alt=""
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <div className="grid w-full max-w-5xl grid-cols-1 justify-items-center gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              {
                src: "/training-benefit-recognized-custom.png",
                label: t("training.credentialInternational"),
              },
              {
                src: "/training-benefit-distinction-custom.png",
                label: t("training.credentialDistinction"),
              },
              {
                src: "/training-benefit-certificate-custom.png",
                label: t("training.credentialCertificate"),
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center justify-center px-4 text-center">
                <img src={item.src} alt={item.label} className="h-14 w-auto sm:h-16" />
                <p className="mt-3 font-header text-[11px] uppercase tracking-[0.12em] text-white sm:text-xs">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. What's included */}
      <section className="w-full bg-white px-[5%] py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-normal tracking-tight text-brand-black md:text-4xl">
            {t("training.includedTitle")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {includedItems.map((item) => (
              <article key={item.title} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="relative h-36 w-full overflow-hidden rounded-md">
                  <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                </div>
                <h3 className="mt-4 font-display text-lg font-normal tracking-tight text-brand-black">
                  {item.title}
                </h3>
                <p className="mt-2 font-header text-sm leading-relaxed text-brand-black/70">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <TestimonialV2 />

      {/* 9. Final CTA */}
      <section className="w-full bg-brand-white px-[5%] py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-normal tracking-tight text-brand-black md:text-5xl">
            {t("training.finalCtaTitle")}
          </h2>
          <p className="mt-4 font-header text-sm leading-relaxed text-brand-black/70 sm:text-base">
            {t("training.finalCtaDesc")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToPrograms()}
              className="font-header inline-flex min-h-12 items-center justify-center rounded-full bg-brand-black px-10 text-sm uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-brand-champagne-dark sm:min-h-[3.25rem] sm:text-[13px]"
            >
              {t("training.explorePrograms")}
            </button>
            <Link
              href="/contact"
              className="font-header inline-flex min-h-12 items-center justify-center rounded-full border border-brand-black px-10 text-sm uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-brand-black hover:text-white sm:min-h-[3.25rem] sm:text-[13px]"
            >
              {t("training.contactUs")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
