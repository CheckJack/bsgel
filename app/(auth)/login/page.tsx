"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we should show register form (from URL param or default)
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Update mode when search params change
  useEffect(() => {
    if (searchParams?.get("mode") === "register") {
      setIsRegisterMode(true);
    }
    
    // Capture referral code from URL if present
    const refCode = searchParams?.get("ref");
    if (refCode) {
      localStorage.setItem("referralCode", refCode);
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      document.cookie = `referralCode=${refCode}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
      console.log("Referral code captured from login page:", refCode);
    }
    
    // Show success message if user just registered
    if (searchParams?.get("registered") === "true") {
      setError("");
      // Could show a success message here if needed
    }
  }, [searchParams]);
  
  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Register state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "customer" as "customer" | "professional",
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setCertificateFile(file);
        const url = URL.createObjectURL(file);
        setCertificatePreview(url);
      } else {
        setError("Please upload a PDF or image file");
      }
    }
  };

  const handleCertificateRemove = () => {
    if (certificatePreview) {
      URL.revokeObjectURL(certificatePreview);
    }
    setCertificateFile(null);
    setCertificatePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.userType === "professional" && !certificateFile) {
      setError("Please upload your certificate");
      return;
    }

    setIsLoading(true);

    try {
      // Get referral code from localStorage or cookie
      const getReferralCode = (): string | null => {
        try {
          // Try localStorage first
          const fromStorage = localStorage.getItem("referralCode");
          if (fromStorage && fromStorage.trim().length >= 3) {
            return fromStorage.trim().toUpperCase();
          }
        } catch (error) {
          console.warn("Failed to read referral code from localStorage:", error);
        }

        try {
          // Try cookie
          const cookies = document.cookie.split("; ");
          const referralCookie = cookies.find(row => row.startsWith("referralCode="));
          if (referralCookie) {
            const code = referralCookie.split("=")[1];
            if (code && code.trim().length >= 3) {
              return code.trim().toUpperCase();
            }
          }
        } catch (error) {
          console.warn("Failed to read referral code from cookie:", error);
        }

        return null;
      };

      const referralCode = getReferralCode();

      let certificateUrl: string | null = null;
      if (formData.userType === "professional" && certificateFile) {
        const reader = new FileReader();
        certificateUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error("Failed to read certificate file"));
          };
          reader.readAsDataURL(certificateFile);
        });
      }

      const payload: {
        name: string;
        email: string;
        password: string;
        userType: string;
        certificate?: string;
        referralCode?: string | null;
      } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        userType: formData.userType,
      };

      if (certificateUrl) {
        payload.certificate = certificateUrl;
      }

      if (referralCode) {
        payload.referralCode = referralCode;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => {
            const field = err.path?.join('.') || 'field';
            return `${field}: ${err.message}`;
          }).join(', ');
          setError(errorMessages || data.error || "Registration failed");
        } else {
          setError(data.error || data.message || "Registration failed");
        }
      } else {
        // Clear referral code after successful registration
        if (referralCode) {
          localStorage.removeItem("referralCode");
          document.cookie = "referralCode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        }

        // Switch to login mode and show success
        setIsRegisterMode(false);
        setError("");
        // Auto-fill email in login form
        setEmail(formData.email);
        // Clear register form
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          userType: "customer",
        });
        setCertificateFile(null);
        if (certificatePreview) {
          URL.revokeObjectURL(certificatePreview);
          setCertificatePreview(null);
        }
        // Update URL without redirecting
        router.push("/login?registered=true", { scroll: false });
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      {/* Left Container - Image */}
      <div className="w-full md:w-1/2 h-48 md:h-full relative flex-shrink-0">
        <Image
          src="/328 Peach Pitstop - hand and product (5).jpg"
          alt="Bio Sculpture Nail Products"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Right Container - Login/Register Form */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center px-4 sm:px-6 bg-white overflow-y-auto">
        <Card className="w-full max-w-md my-4 sm:my-8">
          <CardHeader>
            <CardTitle>{isRegisterMode ? "Create Account" : "Sign In"}</CardTitle>
            <CardDescription>
              {isRegisterMode
                ? "Sign up to start shopping"
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRegisterMode ? (
              // Register Form
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    I am a:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="customer"
                        checked={formData.userType === "customer"}
                        onChange={(e) => setFormData({ ...formData, userType: e.target.value as "customer" | "professional" })}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Customer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="professional"
                        checked={formData.userType === "professional"}
                        onChange={(e) => setFormData({ ...formData, userType: e.target.value as "customer" | "professional" })}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Professional</span>
                    </label>
                  </div>
                </div>

                {/* Certificate Upload - Only show for professionals */}
                {formData.userType === "professional" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload Certificate <span className="text-red-500">*</span>
                    </label>
                    {certificatePreview ? (
                      <div className="relative border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                              <Upload className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {certificateFile?.name || "Certificate"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(certificateFile?.size || 0) / 1024} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleCertificateRemove}
                            className="text-red-600 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleCertificateUpload}
                          className="hidden"
                          id="certificate-upload"
                          disabled={isLoading}
                        />
                        <label
                          htmlFor="certificate-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF or Image (PNG, JPG, etc.)
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {searchParams?.get("registered") === "true" && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                    Account created successfully! Please sign in.
                  </div>
                )}
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={isLoading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-gray-600">
              {isRegisterMode ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setError("");
                    }}
                    className="text-black font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setError("");
                    }}
                    className="text-black font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

