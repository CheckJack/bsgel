"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalonMap } from "@/components/layout/salon-map";
import { useLanguage } from "@/contexts/language-context";

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  logo?: string;
  images?: string[];
  description?: string;
  workingHours?: any;
  isActive: boolean;
  isBioDiamond?: boolean;
  status: string;
}

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const salonId = params.id as string;
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (salonId) {
      fetchSalon();
    }
  }, [salonId]);

  const fetchSalon = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[Salon Detail Page] Fetching salon with ID: ${salonId}`);
      const res = await fetch(`/api/salons/${salonId}`);
      console.log(`[Salon Detail Page] Response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[Salon Detail Page] Salon data received:`, data);
        setSalon(data);
      } else if (res.status === 404) {
        const errorData = await res.json().catch(() => ({}));
        console.log(`[Salon Detail Page] Salon not found:`, errorData);
        setError(t("findSalon.salonNotFound"));
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Salon Detail Page] Error response:`, errorData);
        setError(t("findSalon.failedToLoad"));
      }
    } catch (error) {
      console.error("[Salon Detail Page] Failed to fetch salon:", error);
      setError(t("findSalon.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const formatWorkingHours = (workingHours: any): string => {
    if (!workingHours || typeof workingHours !== "object") {
      return t("findSalon.contactForHours");
    }

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayNames: { [key: string]: string } = {
      monday: t("findSalon.dayNamesFull.monday"),
      tuesday: t("findSalon.dayNamesFull.tuesday"),
      wednesday: t("findSalon.dayNamesFull.wednesday"),
      thursday: t("findSalon.dayNamesFull.thursday"),
      friday: t("findSalon.dayNamesFull.friday"),
      saturday: t("findSalon.dayNamesFull.saturday"),
      sunday: t("findSalon.dayNamesFull.sunday"),
    };

    const hoursList: string[] = [];
    days.forEach((day) => {
      const dayData = workingHours[day];
      if (dayData && !dayData.closed) {
        hoursList.push(
          `${dayNames[day]}: ${dayData.open || "?"} - ${dayData.close || "?"}`
        );
      } else if (dayData?.closed) {
        hoursList.push(`${dayNames[day]}: ${t("findSalon.closed")}`);
      }
    });

    return hoursList.length > 0 ? hoursList.join("\n") : t("findSalon.contactForHours");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-champagne"></div>
          <p className="mt-4 text-brand-champagne">{t("findSalon.loadingSalonInfo")}</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-medium text-brand-black mb-4">
            {error || t("findSalon.salonNotFound")}
          </h1>
          <p className="text-brand-champagne mb-6">
            {t("findSalon.salonNotFoundDesc")}
          </p>
          <Link href="/salons">
            <Button>{t("findSalon.backToSalons")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-white">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-brand-champagne hover:text-brand-black"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("findSalon.backToSalons")}
        </Button>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-brand-champagne/10 to-brand-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Salon Image/Logo */}
            <div className="flex-shrink-0">
              {salon.logo ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-white shadow-lg border border-gray-200 flex items-center justify-center">
                  <Image
                    src={salon.logo}
                    alt={salon.name}
                    width={192}
                    height={192}
                    className="w-full h-full object-contain p-4"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    unoptimized={salon.logo?.startsWith('data:') || salon.logo?.startsWith('blob:') || !salon.logo?.startsWith('http')}
                  />
                </div>
              ) : salon.image ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    unoptimized={salon.image?.startsWith('data:') || salon.image?.startsWith('blob:') || !salon.image?.startsWith('http')}
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MapPin className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Salon Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-medium text-brand-black mb-2">
                    {salon.name}
                  </h1>
                  {salon.isBioDiamond && (
                    <div className="inline-flex items-center gap-2 bg-brand-champagne text-white px-4 py-2 rounded-full text-sm font-medium">
                      <Sparkles className="h-4 w-4" />
                      {t("findSalon.bioDiamondSalon")}
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-brand-champagne flex-shrink-0 mt-1" />
                <div className="text-brand-champagne">
                  <p className="font-medium">{salon.address}</p>
                  <p>
                    {salon.city}
                    {salon.postalCode && `, ${salon.postalCode}`}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex flex-wrap gap-4 mt-6">
                {salon.phone && (
                  <a
                    href={`tel:${salon.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-brand-champagne hover:text-brand-black"
                  >
                    <Phone className="h-4 w-4" />
                    {salon.phone}
                  </a>
                )}
                {salon.email && (
                  <a
                    href={`mailto:${salon.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-brand-champagne hover:text-brand-black"
                  >
                    <Mail className="h-4 w-4" />
                    {t("findSalon.email")}
                  </a>
                )}
                {salon.website && (
                  <a
                    href={salon.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-brand-champagne hover:text-brand-black"
                  >
                    <Globe className="h-4 w-4" />
                    {t("findSalon.website")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {salon.description && (
              <div>
                <h2 className="text-2xl font-medium text-brand-black mb-4">
                  {t("findSalon.about")}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {salon.description}
                </p>
              </div>
            )}

            {/* Gallery */}
            {salon.images && salon.images.length > 0 && (
              <div>
                <h2 className="text-2xl font-medium text-brand-black mb-4">
                  {t("findSalon.gallery")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {salon.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={img}
                        alt={`${salon.name} - Image ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform cursor-pointer"
                        priority={index < 3}
                        loading={index < 3 ? undefined : "lazy"}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                        unoptimized={img?.startsWith('data:') || img?.startsWith('blob:') || !img?.startsWith('http')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Working Hours */}
            {salon.workingHours && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-brand-champagne" />
                  <h3 className="text-xl font-medium text-brand-black">
                    {t("findSalon.openingHours")}
                  </h3>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {formatWorkingHours(salon.workingHours)}
                </div>
              </div>
            )}

            {/* Map */}
            {salon.latitude && salon.longitude && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-64">
                  <SalonMap
                    salons={[salon]}
                    onMarkerClick={() => {}}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

