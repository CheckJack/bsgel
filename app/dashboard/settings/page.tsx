"use client";

import { useEffect, useState } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Camera, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    district: "",
    country: "Portugal",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Always sync profileImage with session image to reflect updates
      setProfileImage(session.user.image || null);
      
      // Load saved shipping address
      const loadShippingAddress = async () => {
        try {
          const res = await fetch("/api/users/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.user?.shippingAddress) {
              try {
                const parsed = JSON.parse(data.user.shippingAddress);
                setShippingAddress({
                  firstName: parsed.firstName || "",
                  lastName: parsed.lastName || "",
                  email: parsed.email || session?.user?.email || "",
                  phone: parsed.phone || "",
                  addressLine1: parsed.addressLine1 || "",
                  addressLine2: parsed.addressLine2 || "",
                  city: parsed.city || "",
                  postalCode: parsed.postalCode || "",
                  district: parsed.district || "",
                  country: parsed.country || "Portugal",
                });
              } catch {
                // If not JSON, just set email
                setShippingAddress((prev) => ({
                  ...prev,
                  email: session?.user?.email || "",
                }));
              }
            } else {
              setShippingAddress((prev) => ({
                ...prev,
                email: session?.user?.email || "",
              }));
            }
          }
        } catch (error) {
          console.error("Failed to load shipping address:", error);
        }
      };
      loadShippingAddress();
    }
  }, [session, status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Validate password change if new password is provided
      if (formData.newPassword) {
        if (formData.newPassword.length < 8) {
          setMessage({ type: "error", text: "Password must be at least 8 characters" });
          setIsSaving(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: "error", text: "Passwords do not match" });
          setIsSaving(false);
          return;
        }
        if (!formData.currentPassword) {
          setMessage({ type: "error", text: "Current password is required to change password" });
          setIsSaving(false);
          return;
        }
      }

      // Prepare form data
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Include shipping address
      updateData.shippingAddress = JSON.stringify(shippingAddress);

      // Handle image upload if new image is selected
      if (imageFile) {
        console.log("Converting image file to base64...", {
          fileName: imageFile.name,
          fileSize: imageFile.size,
          fileType: imageFile.type,
        });
        // Convert file to base64 data URL
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log("Base64 conversion complete, length:", result.length);
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(error);
          };
          reader.readAsDataURL(imageFile);
        });
        updateData.image = base64Image;
        console.log("Image added to updateData, base64 length:", base64Image.length);
      } else {
        console.log("No image file selected, skipping image update");
      }

      await saveSettings(updateData);
    } catch (error) {
      console.error("Failed to update settings:", error);
      setMessage({ type: "error", text: "Failed to update settings. Please try again." });
      setIsSaving(false);
    }
  };

  const saveSettings = async (updateData: any) => {
    try {
      console.log("Saving settings with updateData:", {
        ...updateData,
        image: updateData.image ? `${updateData.image.substring(0, 50)}...` : null,
      });

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const responseData = await res.json();
      console.log("API Response:", {
        ok: res.ok,
        status: res.status,
        data: {
          ...responseData,
          user: responseData.user ? {
            ...responseData.user,
            image: responseData.user.image ? `${responseData.user.image.substring(0, 50)}...` : null,
          } : null,
        },
      });

      if (res.ok) {
        const data = responseData;
        // Update profile image state with the saved image
        const savedImage = data.user?.image || data.image;
        console.log("Saved image:", savedImage ? `${savedImage.substring(0, 50)}...` : null);
        
        if (savedImage) {
          setProfileImage(savedImage);
        } else {
          setProfileImage(null);
        }
        // Clear imageFile since it's been saved
        setImageFile(null);
        // Update session (don't pass image - it's too large for JWT token)
        // The session callback will fetch the image from database instead
        console.log("Updating session (image will be fetched from DB)...");
        await update({
          name: data.user?.name || data.name,
          email: data.user?.email || data.email,
          // Don't pass image here - it causes cookie size issues
          // The session callback will fetch it from database
        });
        console.log("Session updated, forcing refresh...");
        // Force session refresh to ensure all components get the updated image
        await getSession();
        // Refresh router to ensure all components update
        router.refresh();
        setMessage({ type: "success", text: t("clientPanel.settings.settingsUpdated") });
        toast(t("clientPanel.settings.settingsUpdated"), "success");
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        console.error("API Error:", responseData);
        setMessage({ 
          type: "error", 
          text: responseData.error || responseData.message || t("clientPanel.settings.settingsUpdateFailed")
        });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: "error", text: t("clientPanel.settings.settingsUpdateFailed") });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t("clientPanel.settings.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("clientPanel.settings.description")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>{t("clientPanel.settings.profilePicture")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      session?.user?.email?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <label
                    htmlFor="image-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t("clientPanel.settings.uploadNewPicture")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {t("clientPanel.settings.fileTypes")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("clientPanel.settings.personalInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {t("clientPanel.settings.fullName")}
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("clientPanel.settings.enterFullName")}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t("clientPanel.settings.emailAddress")}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("clientPanel.settings.enterEmail")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>{t("clientPanel.settings.shippingAddress")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.firstName")}</label>
                  <Input
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t("clientPanel.settings.firstName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.lastName")}</label>
                  <Input
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t("clientPanel.settings.lastName")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.email")}</label>
                <Input
                  type="email"
                  value={shippingAddress.email}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.phoneNumber")}</label>
                <Input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+351 XXX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.addressLine1")}</label>
                <Input
                  value={shippingAddress.addressLine1}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="Street address, house number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.addressLine2")}</label>
                <Input
                  value={shippingAddress.addressLine2}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.postalCode")}</label>
                  <Input
                    value={shippingAddress.postalCode}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 4) {
                        value = value.slice(0, 4) + "-" + value.slice(4, 7);
                      }
                      setShippingAddress((prev) => ({ ...prev, postalCode: value }));
                    }}
                    placeholder="XXXX-XXX"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.city")}</label>
                  <Input
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder={t("clientPanel.settings.city")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.district")}</label>
                <Input
                  value={shippingAddress.district}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, district: e.target.value }))}
                  placeholder="District (e.g., Lisboa, Porto, Braga)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t("clientPanel.settings.country")}</label>
                <Input
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, country: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t("clientPanel.settings.changePassword")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  {t("clientPanel.settings.currentPassword")}
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder={t("clientPanel.settings.enterCurrentPassword")}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  {t("clientPanel.settings.newPassword")}
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder={t("clientPanel.settings.enterNewPassword")}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  {t("clientPanel.settings.confirmNewPassword")}
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={t("clientPanel.settings.confirmPassword")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="min-w-[120px]">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("clientPanel.settings.saveChanges")}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

