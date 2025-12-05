"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Check } from "lucide-react";

interface Permission {
  addProduct: "allow" | "deny";
  updateProduct: "allow" | "deny";
  deleteProduct: "allow" | "deny";
  applyDiscount: "allow" | "deny";
  createCoupon: "allow" | "deny";
}

export default function NewUserPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [permissions, setPermissions] = useState<Permission>({
    addProduct: "allow",
    updateProduct: "deny",
    deleteProduct: "allow",
    applyDiscount: "deny",
    createCoupon: "deny",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const handlePermissionChange = (
    permission: keyof Permission,
    value: "allow" | "deny"
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "ADMIN", // Set role to ADMIN for backend users
        }),
      });

      if (res.ok) {
        router.push("/admin/users");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create user");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add New User</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> User{" "}
          <span className="mx-2">&gt;</span> Add New User
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fill in the information below to add a new account
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Username"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permission Section */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Permission
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Items that the account is allowed to edit
              </p>
            </div>

            {/* Permission Toggles */}
            <div className="space-y-4">
              {/* Add Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add product
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePermissionChange("addProduct", "allow")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.addProduct === "allow"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {permissions.addProduct === "allow" && (
                      <Check className="h-4 w-4" />
                    )}
                    Allow
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePermissionChange("addProduct", "deny")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.addProduct === "deny"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.addProduct === "deny" && (
                      <Check className="h-4 w-4" />
                    )}
                    Deny
                  </button>
                </div>
              </div>

              {/* Update Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update product
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("updateProduct", "allow")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.updateProduct === "allow"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.updateProduct === "allow" && (
                      <Check className="h-4 w-4" />
                    )}
                    Allow
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("updateProduct", "deny")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.updateProduct === "deny"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.updateProduct === "deny" && (
                      <Check className="h-4 w-4" />
                    )}
                    Deny
                  </button>
                </div>
              </div>

              {/* Delete Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delete product
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("deleteProduct", "allow")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.deleteProduct === "allow"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.deleteProduct === "allow" && (
                      <Check className="h-4 w-4" />
                    )}
                    Allow
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("deleteProduct", "deny")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.deleteProduct === "deny"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.deleteProduct === "deny" && (
                      <Check className="h-4 w-4" />
                    )}
                    Deny
                  </button>
                </div>
              </div>

              {/* Apply Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply discount
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("applyDiscount", "allow")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.applyDiscount === "allow"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.applyDiscount === "allow" && (
                      <Check className="h-4 w-4" />
                    )}
                    Allow
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("applyDiscount", "deny")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.applyDiscount === "deny"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.applyDiscount === "deny" && (
                      <Check className="h-4 w-4" />
                    )}
                    Deny
                  </button>
                </div>
              </div>

              {/* Create Coupon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Create coupon
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("createCoupon", "allow")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.createCoupon === "allow"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.createCoupon === "allow" && (
                      <Check className="h-4 w-4" />
                    )}
                    Allow
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePermissionChange("createCoupon", "deny")
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      permissions.createCoupon === "deny"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {permissions.createCoupon === "deny" && (
                      <Check className="h-4 w-4" />
                    )}
                    Deny
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-start">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

