"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Save } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
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
        const reader = new FileReader();
        reader.onloadend = async () => {
          updateData.image = reader.result;
          await saveSettings(updateData);
        };
        reader.readAsDataURL(imageFile);
      } else {
        await saveSettings(updateData);
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      setMessage({ type: "error", text: "Failed to update settings. Please try again." });
      setIsSaving(false);
    }
  };

  const saveSettings = async (updateData: any) => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        // Update session
        await update({
          name: data.name,
          email: data.email,
          image: data.image,
        });
        setMessage({ type: "success", text: "Settings updated successfully!" });
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to update settings" });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: "error", text: "Failed to update settings. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account information and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
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
                    Upload a new profile picture
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <Input
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <Input
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  value={shippingAddress.email}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <Input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+351 XXX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
                <Input
                  value={shippingAddress.addressLine1}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="Street address, house number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address Line 2</label>
                <Input
                  value={shippingAddress.addressLine2}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code *</label>
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
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <Input
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">District *</label>
                <Input
                  value={shippingAddress.district}
                  onChange={(e) => setShippingAddress((prev) => ({ ...prev, district: e.target.value }))}
                  placeholder="District (e.g., Lisboa, Porto, Braga)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
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
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
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
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

