"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SalonMap } from "@/components/layout/salon-map";
import { Search, MapPin, Phone, Mail, Globe, Clock, Sparkles, X } from "lucide-react";

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

export default function FindSalonPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showBioDiamondOnly, setShowBioDiamondOnly] = useState(false);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

  // Get unique cities from salons
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    salons.forEach((salon) => {
      if (salon.city) {
        citySet.add(salon.city);
      }
    });
    return Array.from(citySet).sort();
  }, [salons]);

  // Fetch salons on mount
  useEffect(() => {
    fetchSalons();
  }, []);

  // Filter salons based on search query, city, and Bio Diamond filter
  useEffect(() => {
    let filtered = [...salons];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (salon) =>
          salon.name.toLowerCase().includes(query) ||
          salon.address.toLowerCase().includes(query) ||
          salon.city.toLowerCase().includes(query) ||
          salon.postalCode?.toLowerCase().includes(query)
      );
    }

    // Apply city filter
    if (selectedCity) {
      filtered = filtered.filter((salon) => salon.city === selectedCity);
    }

    // Apply Bio Diamond filter
    if (showBioDiamondOnly) {
      filtered = filtered.filter((salon) => salon.isBioDiamond === true);
    }

    setFilteredSalons(filtered);
  }, [salons, searchQuery, selectedCity, showBioDiamondOnly]);

  const fetchSalons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/salons");
      if (res.ok) {
        const data = await res.json();
        setSalons(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch salons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerClick = (salonId: string) => {
    setSelectedSalonId(salonId);
    // Scroll to the salon card in the right sidebar
    setTimeout(() => {
      const element = document.getElementById(`salon-${salonId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-brand-champagne");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-brand-champagne");
        }, 2000);
      }
    }, 100);
  };

  const formatWorkingHours = (workingHours: any): string => {
    if (!workingHours || typeof workingHours !== "object") {
      return "Contact for hours";
    }

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayNames: { [key: string]: string } = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };

    const hoursList: string[] = [];
    days.forEach((day) => {
      const dayData = workingHours[day];
      if (dayData && !dayData.closed) {
        hoursList.push(`${dayNames[day]}: ${dayData.open || "?"}-${dayData.close || "?"}`);
      }
    });

    return hoursList.length > 0 ? hoursList.join(", ") : "Contact for hours";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setShowBioDiamondOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCity || showBioDiamondOnly;

  return (
    <div className="min-h-screen bg-brand-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-brand-champagne/10 to-brand-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-3 sm:mb-4 text-brand-black">
              Find Your Salon
            </h1>
            <div className="w-24 h-1 bg-brand-champagne mx-auto mb-4 sm:mb-6"></div>
            <p className="text-base sm:text-lg font-light text-brand-champagne max-w-2xl mx-auto px-4">
              Discover Bio Sculpture salons near you. Search by location, name, or filter by Bio
              Diamond salons.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by salon name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-champagne focus:border-transparent text-brand-black"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* City Filter */}
              <div className="relative flex-1 min-w-[200px]">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-champagne focus:border-transparent text-brand-black bg-white appearance-none cursor-pointer"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio Diamond Filter */}
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={showBioDiamondOnly}
                  onChange={(e) => setShowBioDiamondOnly(e.target.checked)}
                  className="w-4 h-4 text-brand-champagne focus:ring-brand-champagne rounded"
                />
                <Sparkles className="h-4 w-4 text-brand-champagne" />
                <span className="text-sm text-brand-black whitespace-nowrap">
                  Bio Diamond Only
                </span>
              </label>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-brand-black hover:text-brand-champagne transition-colors ml-auto"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-brand-champagne">
              {isLoading ? (
                "Loading salons..."
              ) : (
                <>
                  Found <span className="font-medium">{filteredSalons.length}</span> salon
                  {filteredSalons.length !== 1 ? "s" : ""}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Side by Side Layout */}
      <div className="w-full px-4 pb-12">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-champagne"></div>
            <p className="mt-4 text-brand-champagne">Loading salons...</p>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-medium text-brand-black mb-2">No salons found</h3>
            <p className="text-brand-champagne mb-6">
              Try adjusting your search or filters to find more results.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-brand-black text-brand-white rounded-lg hover:bg-brand-champagne transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-auto lg:h-[calc(100vh-400px)] min-h-[500px] lg:min-h-[600px]">
            {/* Left Side - Map (Larger) */}
            <div className="flex-[2] lg:w-[70%] h-[400px] sm:h-[500px] lg:h-full lg:min-h-0">
              <div className="w-full h-full rounded-lg overflow-hidden border border-gray-300">
                <SalonMap salons={filteredSalons} onMarkerClick={handleMarkerClick} />
              </div>
            </div>

            {/* Right Side - Salon List (Smaller) */}
            <div className="flex-[1] lg:w-[30%] h-auto lg:h-full lg:overflow-y-auto">
              <div className="space-y-3 sm:space-y-4 pr-0 sm:pr-2 pb-4">
                {filteredSalons.map((salon) => (
                  <SalonCard
                    key={salon.id}
                    salon={salon}
                    formatWorkingHours={formatWorkingHours}
                    isSelected={selectedSalonId === salon.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Salon Card Component
function SalonCard({
  salon,
  formatWorkingHours,
  isSelected,
}: {
  salon: Salon;
  formatWorkingHours: (hours: any) => string;
  isSelected: boolean;
}) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link (phone, email, website)
    const target = e.target as HTMLElement;
    if (
      target.closest("a") ||
      target.tagName === "A" ||
      target.closest("button")
    ) {
      return;
    }
    router.push(`/salons/${salon.id}`);
  };

  return (
    <div
      id={`salon-${salon.id}`}
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-brand-champagne" : ""
      }`}
    >
      {/* Salon Image */}
      {salon.image && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          <img
            src={salon.image}
            alt={salon.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {salon.isBioDiamond && (
            <div className="absolute top-2 right-2 bg-brand-champagne text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Bio Diamond
            </div>
          )}
        </div>
      )}

      {/* Salon Content */}
      <div className="p-6">
        <h3 className="text-xl font-medium text-brand-black mb-2">{salon.name}</h3>

        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-brand-champagne flex-shrink-0 mt-1" />
          <div className="text-sm text-brand-champagne">
            <p>{salon.address}</p>
            <p>
              {salon.city}
              {salon.postalCode && `, ${salon.postalCode}`}
            </p>
          </div>
        </div>

        {/* Description */}
        {salon.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{salon.description}</p>
        )}

        {/* Working Hours */}
        {salon.workingHours && (
          <div className="flex items-start gap-2 mb-3">
            <Clock className="h-4 w-4 text-brand-champagne flex-shrink-0 mt-1" />
            <p className="text-xs text-gray-600">{formatWorkingHours(salon.workingHours)}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="flex items-center gap-2 text-sm text-brand-champagne hover:text-brand-black transition-colors"
            >
              <Phone className="h-4 w-4" />
              {salon.phone}
            </a>
          )}
          {salon.email && (
            <a
              href={`mailto:${salon.email}`}
              className="flex items-center gap-2 text-sm text-brand-champagne hover:text-brand-black transition-colors"
            >
              <Mail className="h-4 w-4" />
              {salon.email}
            </a>
          )}
          {salon.website && (
            <a
              href={salon.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-champagne hover:text-brand-black transition-colors"
            >
              <Globe className="h-4 w-4" />
              Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

