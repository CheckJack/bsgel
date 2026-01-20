"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Upload,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
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
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedAt?: string;
}

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

export default function SalonPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  
  const DAYS = [
    { key: "monday", label: t("clientPanel.salon.monday") },
    { key: "tuesday", label: t("clientPanel.salon.tuesday") },
    { key: "wednesday", label: t("clientPanel.salon.wednesday") },
    { key: "thursday", label: t("clientPanel.salon.thursday") },
    { key: "friday", label: t("clientPanel.salon.friday") },
    { key: "saturday", label: t("clientPanel.salon.saturday") },
    { key: "sunday", label: t("clientPanel.salon.sunday") },
  ];
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastGeocodedAddressRef = useRef<string>("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    website: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const [image, setImage] = useState<{ url: string; file?: File } | null>(null);
  const [logo, setLogo] = useState<{ url: string; file?: File } | null>(null);
  const [images, setImages] = useState<{ url: string; file?: File }[]>([]);

  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "18:00", closed: false },
    sunday: { open: "", close: "", closed: true },
  });

  useEffect(() => {
    // Check if user is a professional (has certification)
    // Only professionals can access salon management
    if (session?.user && !session.user.certification) {
      router.push("/dashboard");
      return;
    }
    fetchSalon();
  }, [session, router]);

  // Auto-geocode address when city, address, and postal code are filled
  useEffect(() => {
    // Only geocode when editing and all required fields are filled
    if (!isEditing) return;
    
    const address = formData.address.trim();
    const city = formData.city.trim();
    const postalCode = formData.postalCode.trim();

    // Check if all required fields are filled
    if (!address || !city) return;

    // Build a unique key for this address combination
    const addressKey = `${address}|${city}|${postalCode}`;
    
    // Skip if we've already geocoded this exact address
    if (addressKey === lastGeocodedAddressRef.current) return;

    // Clear existing timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Debounce geocoding by 1 second after user stops typing
    geocodeTimeoutRef.current = setTimeout(async () => {
      // Double-check fields are still filled
      if (!formData.address.trim() || !formData.city.trim()) return;

      setIsGeocoding(true);
      try {
        const params = new URLSearchParams({
          address: formData.address.trim(),
          city: formData.city.trim(),
        });
        if (formData.postalCode.trim()) {
          params.append("postalCode", formData.postalCode.trim());
        }

        const res = await fetch(`/api/geocode?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.lat && data.lng) {
          // Update coordinates
          setFormData((prev) => ({
            ...prev,
            latitude: data.lat.toString(),
            longitude: data.lng.toString(),
          }));
          lastGeocodedAddressRef.current = addressKey;
        } else {
          // Silently fail - user can still enter coordinates manually
          console.log("Geocoding failed:", data.error);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        // Silently fail - user can still enter coordinates manually
      } finally {
        setIsGeocoding(false);
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [formData.address, formData.city, formData.postalCode, isEditing]);

  const fetchSalon = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/salons/my-salon");
      if (res.ok) {
        const data = await res.json();
        setSalon(data);
        populateForm(data);
        setIsEditing(false);
      } else if (res.status === 404) {
        // No salon exists yet - that's okay
        setSalon(null);
        setIsEditing(true);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to fetch salon");
      }
    } catch (error) {
      console.error("Failed to fetch salon:", error);
      setError("Failed to load salon information");
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (salonData: Salon) => {
    const addressKey = `${salonData.address || ""}|${salonData.city || ""}|${salonData.postalCode || ""}`;
    lastGeocodedAddressRef.current = addressKey;
    
    setFormData({
      name: salonData.name || "",
      address: salonData.address || "",
      city: salonData.city || "",
      postalCode: salonData.postalCode || "",
      phone: salonData.phone || "",
      website: salonData.website || "",
      latitude: salonData.latitude?.toString() || "",
      longitude: salonData.longitude?.toString() || "",
      description: salonData.description || "",
    });

    if (salonData.image) {
      setImage({ url: salonData.image });
    }
    if (salonData.logo) {
      setLogo({ url: salonData.logo });
    }
    if (salonData.images && salonData.images.length > 0) {
      setImages(salonData.images.map((img) => ({ url: img })));
    }

    if (salonData.workingHours) {
      setWorkingHours({ ...workingHours, ...salonData.workingHours });
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "logo" | "images"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    const url = URL.createObjectURL(file);

    if (type === "image") {
      setImage({ url, file });
    } else if (type === "logo") {
      setLogo({ url, file });
    } else if (type === "images") {
      setImages((prev) => [...prev, { url, file }]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Salon name is required");
      return;
    }
    if (!formData.address.trim()) {
      setError(t("clientPanel.salon.addressRequired"));
      return;
    }
    if (!formData.city.trim()) {
      setError(t("clientPanel.salon.cityRequired"));
      return;
    }

    setIsSaving(true);

    try {
      // Convert images to base64
      const imageBase64 = image?.file
        ? await convertFileToBase64(image.file)
        : image?.url || null;

      const logoBase64 = logo?.file
        ? await convertFileToBase64(logo.file)
        : logo?.url || null;

      const imagesBase64 = await Promise.all(
        images.map((img) =>
          img.file ? convertFileToBase64(img.file) : Promise.resolve(img.url)
        )
      );

      const salonData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        image: imageBase64,
        logo: logoBase64,
        images: imagesBase64.filter((img) => img !== null),
        description: formData.description.trim() || null,
        workingHours: workingHours,
      };

      let res;
      if (salon) {
        // Update existing salon
        res = await fetch(`/api/salons/${salon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(salonData),
        });
      } else {
        // Create new salon
        res = await fetch("/api/salons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(salonData),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setSuccess(
          salon
            ? "Salon updated successfully! Your changes are pending review."
            : "Salon created successfully! It's now pending review by an administrator."
        );
        await fetchSalon();
        setIsEditing(false);
      } else {
        setError(data.error || "Failed to save salon");
      }
    } catch (error: any) {
      console.error("Failed to save salon:", error);
      setError(error.message || "Failed to save salon. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!salon) return null;

    const statusConfig = {
      PENDING_REVIEW: {
        icon: AlertCircle,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
        text: t("clientPanel.salon.pendingReviewStatus"),
      },
      APPROVED: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
        text: t("clientPanel.salon.approvedStatus"),
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
        text: t("clientPanel.salon.rejectedStatus"),
      },
    };

    const config = statusConfig[salon.status];
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="h-4 w-4" />
        {config.text}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("clientPanel.salon.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {salon
              ? t("clientPanel.salon.manageListing")
              : t("clientPanel.salon.description")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {salon && getStatusBadge()}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // If salon is approved and active, show live page in pop-up
              if (salon?.status === "APPROVED" && salon?.isActive) {
                setShowLivePreview(true);
              } else {
                // Otherwise show preview with current form data
                setShowPreview(true);
              }
            }}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {salon?.status === "APPROVED" && salon?.isActive ? "View Live Page" : "Preview"}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {salon?.status === "PENDING_REVIEW" && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t("clientPanel.salon.pendingReview")}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t("clientPanel.salon.pendingReviewDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      {salon?.status === "REJECTED" && salon.rejectionReason && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {t("clientPanel.salon.salonRejected")}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t("clientPanel.salon.rejectionReason")} {salon.rejectionReason}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t("clientPanel.salon.updateAndResubmit")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("clientPanel.salon.basicInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("clientPanel.salon.salonName")} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("clientPanel.salon.enterSalonName")}
                  required
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("clientPanel.salon.city")} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder={t("clientPanel.salon.enterCity")}
                  required
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.salon.address")} <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder={t("clientPanel.salon.enterAddress")}
                required
                disabled={!isEditing}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("clientPanel.salon.postalCode")}
                </label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  placeholder={t("clientPanel.salon.postalCodePlaceholder")}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                  {isGeocoding && (
                    <span className="ml-2 text-xs text-gray-500">(auto-detecting...)</span>
                  )}
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="e.g., 38.7223"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                  {isGeocoding && (
                    <span className="ml-2 text-xs text-gray-500">(auto-detecting...)</span>
                  )}
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="e.g., -9.1393"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.salon.descriptionLabel")}
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("clientPanel.salon.describeSalon")}
                rows={4}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("clientPanel.salon.contactInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("clientPanel.salon.phone")}
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={t("clientPanel.salon.phoneNumber")}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("clientPanel.salon.website")}
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <Input
                value={session?.user?.email || ""}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your account email is used for salon contact
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("clientPanel.salon.workingHours")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day) => (
              <div
                key={day.key}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-24">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!workingHours[day.key].closed}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day.key]: {
                            ...workingHours[day.key],
                            closed: !e.target.checked,
                            open: e.target.checked ? "09:00" : "",
                            close: e.target.checked ? "18:00" : "",
                          },
                        })
                      }
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.label}
                    </span>
                  </label>
                </div>
                {!workingHours[day.key].closed && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={workingHours[day.key].open}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day.key]: {
                            ...workingHours[day.key],
                            open: e.target.value,
                          },
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={workingHours[day.key].close}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day.key]: {
                            ...workingHours[day.key],
                            close: e.target.value,
                          },
                        })
                      }
                      disabled={!isEditing}
                      className="flex-1"
                    />
                  </div>
                )}
                {workingHours[day.key].closed && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t("clientPanel.salon.closed")}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("clientPanel.salon.images")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.salon.mainImage")}
              </label>
              {image && (
                <div className="relative inline-block mb-2">
                  <img
                    src={image.url}
                    alt="Salon"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {isEditing && (
                <div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "image")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {image ? t("clientPanel.salon.changeImage") : t("clientPanel.salon.uploadImage")}
                  </Button>
                </div>
              )}
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.salon.logo")}
              </label>
              {logo && (
                <div className="relative inline-block mb-2">
                  <img
                    src={logo.url}
                    alt="Logo"
                    className="h-24 w-24 object-contain rounded-lg"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              {isEditing && (
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "logo")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {logo ? t("clientPanel.salon.changeLogo") : t("clientPanel.salon.uploadLogo")}
                  </Button>
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.salon.galleryImages")}
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.url}
                        alt={`Gallery ${index + 1}`}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            setImages(images.filter((_, i) => i !== index))
                          }
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <div>
                  <input
                    ref={imagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, "images")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imagesInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t("clientPanel.salon.addGalleryImages")}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          {salon && !isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              {t("clientPanel.salon.editSalon")}
            </Button>
          )}
          {isEditing && (
            <>
              {salon && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    populateForm(salon);
                    setIsEditing(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {t("clientPanel.salon.cancel")}
                </Button>
              )}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("clientPanel.salon.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {salon ? t("clientPanel.salon.updateSalon") : t("clientPanel.salon.createSalon")}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </form>

      {/* Live Salon Page Preview Modal (for approved salons) */}
      {showLivePreview && salon?.id && (
        <LiveSalonPreviewModal
          salonId={salon.id}
          onClose={() => setShowLivePreview(false)}
        />
      )}

      {/* Preview Modal (for pending/editing salons) */}
      {showPreview && (
        <SalonPreviewModal
          salon={{
            id: salon?.id || "",
            name: formData.name || salon?.name || "",
            address: formData.address || salon?.address || "",
            city: formData.city || salon?.city || "",
            postalCode: formData.postalCode || salon?.postalCode || "",
            phone: formData.phone || salon?.phone || "",
            email: session?.user?.email || salon?.email || "",
            website: formData.website || salon?.website || "",
            latitude: formData.latitude ? parseFloat(formData.latitude) : salon?.latitude,
            longitude: formData.longitude ? parseFloat(formData.longitude) : salon?.longitude,
            image: image?.url || salon?.image,
            logo: logo?.url || salon?.logo,
            images: images.length > 0 ? images.map(img => img.url) : (salon?.images || []),
            description: formData.description || salon?.description || "",
            workingHours: Object.keys(workingHours).length > 0 ? workingHours : (salon?.workingHours || {}),
            isActive: salon?.isActive || false,
            isBioDiamond: salon?.isBioDiamond || false,
            status: salon?.status || "PENDING_REVIEW",
          }}
          onClose={() => {
            setShowPreview(false);
            setPreviewImageIndex(0);
          }}
        />
      )}
    </div>
  );
}

// Live Salon Page Preview Modal Component (for approved salons)
function LiveSalonPreviewModal({
  salonId,
  onClose,
}: {
  salonId: string;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setShouldRender(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-7xl h-[90vh] bg-white rounded-lg shadow-2xl transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-900" />
        </button>

        {/* Iframe for live salon page */}
        <iframe
          src={`/salons/${salonId}`}
          className="w-full h-full rounded-lg"
          style={{ border: 'none' }}
          title="Salon Preview"
        />
      </div>
    </div>
  );
}

// Salon Preview Modal Component
function SalonPreviewModal({
  salon,
  onClose,
}: {
  salon: Salon;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setShouldRender(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
    }, 300);
  };

  if (!shouldRender) return null;

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

  const galleryImages = salon?.images && salon.images.length > 0 
    ? salon.images 
    : salon?.image 
      ? [salon.image] 
      : [];

  const nextImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-7xl bg-brand-white rounded-lg shadow-2xl transition-all duration-300 ease-out my-8 ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-900" />
        </button>

        {/* Preview Content */}
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Gallery Hero Section */}
          {galleryImages.length > 0 && (
            <div className="relative w-full h-[40vh] sm:h-[45vh] lg:h-[50vh] overflow-hidden">
              <div className="relative w-full h-full">
                <img
                  src={galleryImages[currentImageIndex]}
                  alt={`${salon?.name} - Gallery ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                
                {/* Navigation Buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-brand-champagne hover:text-brand-black rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-brand-champagne hover:text-brand-black rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-light">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="bg-gradient-to-b from-brand-sweet-bianca/40 via-brand-white to-brand-white py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
                {/* Salon Image/Logo */}
                <div className="flex-shrink-0 w-full lg:w-auto">
                  {salon.logo ? (
                    <div className="relative w-full sm:w-64 h-64 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-brand-sweet-bianca/50 flex items-center justify-center">
                      <img
                        src={salon.logo}
                        alt={salon.name}
                        className="w-full h-full object-contain p-6"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  ) : salon.image ? (
                    <div className="relative w-full sm:w-64 h-64 rounded-2xl overflow-hidden bg-gray-50 shadow-xl">
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
                    <div className="w-full sm:w-64 h-64 rounded-2xl bg-brand-sweet-bianca/20 flex items-center justify-center border-2 border-brand-sweet-bianca/30">
                      <MapPin className="h-20 w-20 text-brand-champagne/40" />
                    </div>
                  )}
                </div>

                {/* Salon Info */}
                <div className="flex-1 w-full">
                  <div className="mb-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-medium text-brand-black leading-tight">
                        {salon.name || "Salon Name"}
                      </h1>
                      {salon.isBioDiamond && (
                        <div className="inline-flex items-center gap-2 bg-brand-champagne text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-md">
                          <Sparkles className="h-4 w-4" />
                          {t("findSalon.bioDiamondSalon")}
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3 mb-6">
                      <MapPin className="h-5 w-5 text-brand-champagne flex-shrink-0 mt-1" />
                      <div className="text-brand-champagne font-light">
                        <p className="font-medium text-base">{salon.address || "Address"}</p>
                        <p className="text-sm">
                          {salon.city || "City"}
                          {salon.postalCode && `, ${salon.postalCode}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="flex flex-wrap gap-3">
                    {salon.phone && (
                      <div className="group flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-brand-sweet-bianca rounded-xl shadow-sm">
                        <Phone className="h-4 w-4" />
                        <span className="font-light text-sm">{salon.phone}</span>
                      </div>
                    )}
                    {salon.email && (
                      <div className="group flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-brand-sweet-bianca rounded-xl shadow-sm">
                        <Mail className="h-4 w-4" />
                        <span className="font-light text-sm">{t("findSalon.email")}</span>
                      </div>
                    )}
                    {salon.website && (
                      <div className="group flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-brand-sweet-bianca rounded-xl shadow-sm">
                        <Globe className="h-4 w-4" />
                        <span className="font-light text-sm">{t("findSalon.website")}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
            {/* Opening Hours & Map Section */}
            {(salon.workingHours || (salon.latitude && salon.longitude)) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Opening Hours */}
                {salon.workingHours && (
                  <div className="bg-white rounded-2xl shadow-sm border border-brand-sweet-bianca/30 p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-brand-sweet-bianca/40 rounded-lg">
                        <Clock className="h-5 w-5 text-brand-champagne" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-heading font-medium text-brand-black">
                        {t("findSalon.openingHours")}
                      </h2>
                    </div>
                    <div className="text-sm sm:text-base text-brand-black/70 font-light leading-relaxed whitespace-pre-line space-y-1">
                      {formatWorkingHours(salon.workingHours).split('\n').map((line, idx) => (
                        <div key={idx} className="py-1.5 border-b border-brand-sweet-bianca/20 last:border-0">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map */}
                {salon.latitude && salon.longitude && (
                  <div className="bg-white rounded-2xl shadow-sm border border-brand-sweet-bianca/30 overflow-hidden">
                    <div className="h-64 sm:h-80 lg:h-full min-h-[300px] flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">Map Preview</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* About Section */}
            {salon.description && (
              <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-brand-sweet-bianca/30">
                <h2 className="text-2xl sm:text-3xl font-heading font-medium text-brand-black mb-6">
                  {t("findSalon.about")}
                </h2>
                <p className="text-brand-black/80 font-light leading-relaxed text-base sm:text-lg whitespace-pre-line">
                  {salon.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

