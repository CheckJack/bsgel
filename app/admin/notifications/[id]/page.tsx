"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload } from "lucide-react";
import { compressImage } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  linkUrl: string;
  image?: string | null;
  type: string;
  scheduledFor: string | null;
  isScheduled: boolean;
  userId: string | null;
}

export default function EditNotificationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    linkUrl: "",
    isScheduled: false,
    scheduledFor: new Date().toISOString().slice(0, 16),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchNotification();
    }
  }, [params.id]);

  const fetchNotification = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/admin/notifications/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || "",
          message: data.message || "",
          linkUrl: data.linkUrl || "",
          isScheduled: data.isScheduled || false,
          scheduledFor: data.scheduledFor
            ? new Date(data.scheduledFor).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        });
        setExistingImage(data.image || null);
        setImagePreview(data.image || null);
      } else {
        setError("Failed to load notification");
      }
    } catch (error) {
      console.error("Failed to fetch notification:", error);
      setError("Failed to load notification");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.message.trim()) {
      setError("Message is required");
      return;
    }

    if (!formData.linkUrl.trim()) {
      setError("Link URL is required");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.linkUrl);
    } catch {
      // If URL parsing fails, check if it's a relative path
      if (!formData.linkUrl.startsWith("/")) {
        setError("Link URL must be a valid URL (starting with http:// or https://) or a relative path (starting with /)");
        return;
      }
    }

    if (formData.isScheduled) {
      const scheduledDate = new Date(formData.scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        setError("Invalid scheduled date/time");
        return;
      }
      if (scheduledDate <= new Date()) {
        setError("Scheduled date/time must be in the future");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Compress image if a new one was uploaded
      let compressedImage: string | null | undefined = undefined;
      if (imageFile) {
        setIsCompressingImage(true);
        try {
          compressedImage = await compressImage(imageFile, 200, 200, 0.7);
        } catch (compressionError) {
          console.error("Failed to compress image:", compressionError);
          setError("Failed to compress image. Please try another image.");
          setIsLoading(false);
          setIsCompressingImage(false);
          return;
        } finally {
          setIsCompressingImage(false);
        }
      } else if (imageFile === null && !imagePreview) {
        // If image was removed, set to null
        compressedImage = null;
      }

      const notificationData: any = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        linkUrl: formData.linkUrl.trim(),
        isScheduled: formData.isScheduled,
        scheduledFor: formData.isScheduled ? formData.scheduledFor : null,
      };
      
      // Only include image if it was changed
      if (compressedImage !== undefined) {
        notificationData.image = compressedImage;
      }

      const res = await fetch(`/api/admin/notifications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });

      if (res.ok) {
        router.push("/admin/notifications");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update notification");
      }
    } catch (error) {
      console.error("Failed to update notification:", error);
      setError("An error occurred while updating the notification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Notification
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Notifications{" "}
          <span className="mx-2">&gt;</span> Edit Notification
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="Enter notification title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                maxLength={200}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                A brief title for the notification (max 200 characters)
              </p>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                placeholder="Enter notification message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
                rows={4}
                className="flex min-h-[100px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                The notification message that users will see
              </p>
            </div>

            {/* Link URL */}
            <div>
              <label
                htmlFor="linkUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Link URL <span className="text-red-500">*</span>
              </label>
              <Input
                id="linkUrl"
                placeholder="/products or https://example.com"
                value={formData.linkUrl}
                onChange={(e) =>
                  setFormData({ ...formData, linkUrl: e.target.value })
                }
                required
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL where users will be redirected when clicking the notification. Can be a relative path (e.g., /products) or absolute URL (e.g., https://example.com)
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Image (Optional)
              </label>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <label
                    htmlFor="image"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload an image
                    </span>
                    <span className="text-xs text-gray-500">
                      Image will be automatically compressed to a small size
                    </span>
                  </label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative inline-block">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Add or update the image for the notification. Image will be automatically compressed to keep it small.
              </p>
            </div>

            {/* Note about target audience */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Note: Target audience cannot be changed after creation. Only title, message, link URL, and scheduling can be edited.
              </p>
            </div>

            {/* Scheduling */}
            <div className="border-t pt-6">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={formData.isScheduled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isScheduled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Schedule for later
                </span>
              </label>

              {formData.isScheduled && (
                <div>
                  <label
                    htmlFor="scheduledFor"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledFor: e.target.value,
                      })
                    }
                    min={new Date().toISOString().slice(0, 16)}
                    required={formData.isScheduled}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Select the date and time when the notification should be sent
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            type="submit"
            disabled={isLoading || isCompressingImage}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isCompressingImage ? "Compressing image..." : isLoading ? "Updating..." : "Update Notification"}
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/admin/notifications")}
            variant="outline"
            className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

