"use client";

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
} from "lucide-react";

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

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function SalonPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

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
    isBioDiamond: false,
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
    fetchSalon();
  }, [session]);

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
      isBioDiamond: salonData.isBioDiamond || false,
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
      setError("Address is required");
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required");
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
        isBioDiamond: formData.isBioDiamond,
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
        text: "Pending Review",
      },
      APPROVED: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
        text: "Approved",
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
        text: "Rejected",
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
            My Salon
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {salon
              ? "Manage your salon listing information"
              : "Create your salon listing to appear in our salon finder"}
          </p>
        </div>
        {salon && getStatusBadge()}
      </div>

      {/* Status Messages */}
      {salon?.status === "PENDING_REVIEW" && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Your salon is pending review
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your salon listing will be visible to customers once approved by
                an administrator.
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
                Your salon was rejected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Reason: {salon.rejectionReason}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Please update your salon information and resubmit for review.
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
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salon Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter salon name"
                  required
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Enter city"
                  required
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter full address"
                required
                disabled={!isEditing}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Postal Code
                </label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  placeholder="Postal code"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
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
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your salon..."
                rows={4}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
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
            <CardTitle>Working Hours</CardTitle>
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
                    Closed
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Main Image
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
                    {image ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              )}
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo
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
                    {logo ? "Change Logo" : "Upload Logo"}
                  </Button>
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gallery Images
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
                    Add Gallery Images
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isBioDiamond}
                onChange={(e) =>
                  setFormData({ ...formData, isBioDiamond: e.target.checked })
                }
                disabled={!isEditing}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio Diamond Salon
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mark your salon as a Bio Diamond certified location
            </p>
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
              Edit Salon
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
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {salon ? "Update Salon" : "Create Salon"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

