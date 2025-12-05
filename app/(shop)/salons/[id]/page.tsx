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
      const res = await fetch(`/api/salons/${salonId}`);
      if (res.ok) {
        const data = await res.json();
        setSalon(data);
      } else if (res.status === 404) {
        setError("Salon not found");
      } else {
        setError("Failed to load salon information");
      }
    } catch (error) {
      console.error("Failed to fetch salon:", error);
      setError("Failed to load salon information");
    } finally {
      setIsLoading(false);
    }
  };

  const formatWorkingHours = (workingHours: any): string => {
    if (!workingHours || typeof workingHours !== "object") {
      return "Contact for hours";
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
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };

    const hoursList: string[] = [];
    days.forEach((day) => {
      const dayData = workingHours[day];
      if (dayData && !dayData.closed) {
        hoursList.push(
          `${dayNames[day]}: ${dayData.open || "?"} - ${dayData.close || "?"}`
        );
      } else if (dayData?.closed) {
        hoursList.push(`${dayNames[day]}: Closed`);
      }
    });

    return hoursList.length > 0 ? hoursList.join("\n") : "Contact for hours";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-champagne"></div>
          <p className="mt-4 text-brand-champagne">Loading salon information...</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-medium text-brand-black mb-4">
            {error || "Salon not found"}
          </h1>
          <p className="text-brand-champagne mb-6">
            The salon you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/salons">
            <Button>Back to Salons</Button>
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
          Back to Salons
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
                  <img
                    src={salon.logo}
                    alt={salon.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              ) : salon.image ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100 shadow-lg">
                  <img
                    src={salon.image}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
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
                      Bio Diamond Salon
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
                    Email
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
                    Website
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
                  About
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
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {salon.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={img}
                        alt={`${salon.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
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
                    Opening Hours
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

