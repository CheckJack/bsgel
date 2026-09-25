"use client";

// Force dynamic rendering - this page uses searchParams and localStorage
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { syncAuthMobileBgHeight, clearAuthMobileBgHeight } from "@/lib/mobile-scroll-root";

/** Stable public paths — optimized WebP at display sizes (see public/auth/). */
const LOGIN_DESKTOP_IMAGE = "/auth/login-desktop.webp";
const LOGIN_MOBILE_IMAGE = "/auth/login-mobile.webp";

function AuthMobileBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
    return null;
  }

  return createPortal(
    <div
      className="auth-mobile-bg-bleed pointer-events-none relative overflow-hidden bg-[#c8b8a8] lg:hidden"
      aria-hidden
    >
      <Image
        src={LOGIN_MOBILE_IMAGE}
        alt=""
        fill
        className="object-cover"
        priority
        // Already resized/compressed WebP — serve statically so preload matches LCP URL.
        unoptimized
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>,
    document.body
  );
}

function useAuthLayoutMode() {
  const [layout, setLayout] = useState<{ ready: boolean; isMobile: boolean }>({
    ready: false,
    isMobile: false,
  });

  useEffect(() => {
    setLayout({
      ready: true,
      isMobile: window.matchMedia("(max-width: 1023px)").matches,
    });

    const media = window.matchMedia("(max-width: 1023px)");
    const onChange = () => {
      setLayout((current) => ({
        ...current,
        isMobile: media.matches,
      }));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return layout;
}

function AuthMobileFormPane({
  isExpandedMode,
  children,
}: {
  isExpandedMode: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    syncAuthMobileBgHeight();
    const onResize = () => syncAuthMobileBgHeight();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      clearAuthMobileBgHeight();
    };
  }, []);

  useEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = 0;
  }, [isExpandedMode]);

  if (!mounted) return null;
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
    return null;
  }

  return createPortal(
    <div
      ref={paneRef}
      data-auth-mobile-pane
      data-auth-mode={isExpandedMode ? "register" : "login"}
      className={cn(
        "auth-mobile-form-pane lg:hidden",
        isExpandedMode ? "auth-mobile-form-pane--register" : "auth-mobile-form-pane--login"
      )}
    >
      <div className="auth-mobile-form-pane__inner">{children}</div>
    </div>,
    document.body
  );
}

type AuthView = "login" | "register" | "verify" | "forgot" | "reset";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { ready: layoutReady, isMobile } = useAuthLayoutMode();
  
  const [authView, setAuthView] = useState<AuthView>("login");
  const isExpandedMode =
    authView === "register" ||
    authView === "verify" ||
    authView === "forgot" ||
    authView === "reset";
  const registeredToastShown = useRef(false);
  const desktopFormScrollRef = useRef<HTMLDivElement>(null);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verify email
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Password reset
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Register state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    marketingConsent: false,
    userType: "customer" as "customer" | "professional",
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCertificationId, setSelectedCertificationId] = useState<string | null>(null);

  // Track professional registration step
  const [professionalStep, setProfessionalStep] = useState<"certification" | "upload" | "complete">("certification");

  // Update mode when search params change
  useEffect(() => {
    const mode = searchParams?.get("mode");
    const token = searchParams?.get("token") || searchParams?.get("resetToken");

    if (mode === "register") {
      setAuthView("register");
    } else if (mode === "reset" && token) {
      setAuthView("reset");
      setResetToken(token);
    } else if (mode === "forgot") {
      setAuthView("forgot");
    } else if (mode === "verify") {
      setAuthView("verify");
      const e = searchParams?.get("email");
      if (e) setVerifyEmail(e);
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

    // Success toast after verified signup (once), then clean the query
    if (searchParams?.get("registered") === "true" && !registeredToastShown.current) {
      registeredToastShown.current = true;
      setError("");
      toast(t("auth.verifySuccess"), "success", 6000);
      setAuthView("login");
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router, t]);

  // Fetch certifications when in professional mode
  useEffect(() => {
    if (authView === "register" && formData.userType === "professional") {
      fetchCertifications();
      // Reset professional step when switching to professional
      setProfessionalStep("certification");
      setSelectedCertificationId(null);
      setCertificateFile(null);
      if (certificatePreview) {
        URL.revokeObjectURL(certificatePreview);
        setCertificatePreview(null);
      }
    } else if (formData.userType === "customer") {
      // Reset professional step when switching to customer
      setProfessionalStep("certification");
      setSelectedCertificationId(null);
      setCertificateFile(null);
      if (certificatePreview) {
        URL.revokeObjectURL(certificatePreview);
        setCertificatePreview(null);
      }
    }
  }, [authView, formData.userType]);
  
  // Update professional step when certification is selected
  useEffect(() => {
    if (formData.userType === "professional" && selectedCertificationId) {
      setProfessionalStep("upload");
    } else if (formData.userType === "professional" && !selectedCertificationId) {
      setProfessionalStep("certification");
    }
  }, [selectedCertificationId, formData.userType]);
  
  // Reset certificate when certification selection changes (using a separate effect to avoid dependency issues)
  const prevCertificationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (formData.userType === "professional" && selectedCertificationId && prevCertificationIdRef.current !== selectedCertificationId && prevCertificationIdRef.current !== null) {
      // Certification changed, reset certificate
      setCertificateFile(null);
      if (certificatePreview) {
        URL.revokeObjectURL(certificatePreview);
        setCertificatePreview(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    prevCertificationIdRef.current = selectedCertificationId;
  }, [selectedCertificationId, formData.userType, certificatePreview]);
  
  // Update professional step when certificate is uploaded
  useEffect(() => {
    if (formData.userType === "professional" && certificateFile && selectedCertificationId) {
      setProfessionalStep("complete");
    } else if (formData.userType === "professional" && !certificateFile && selectedCertificationId) {
      setProfessionalStep("upload");
    }
  }, [certificateFile, selectedCertificationId, formData.userType]);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (desktopFormScrollRef.current) {
      desktopFormScrollRef.current.scrollTop = 0;
    }
  }, [authView]);

  const fetchCertifications = async () => {
    try {
      const res = await fetch("/api/certifications?public=true&isActive=true");
      if (res.ok) {
        const data = await res.json();
        setCertifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch certifications:", error);
    }
  };

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
        const err = String(result.error);
        if (err.includes("EMAIL_NOT_VERIFIED")) {
          setError(t("auth.emailNotVerified"));
          setVerifyEmail(email.trim().toLowerCase());
          setAuthView("verify");
        } else if (err.includes("ACCOUNT_BANNED")) {
          setError(t("auth.accountBanned"));
        } else if (err.includes("ACCOUNT_INACTIVE")) {
          setError(t("auth.accountInactive"));
        } else if (err.includes("RATE_LIMITED") || result.status === 429) {
          setError(t("auth.rateLimited"));
        } else {
          setError(t("auth.invalidCredentials"));
        }
      } else {
        // Wait a moment for session to be available, then check user role
        // Retry getting session in case of timing issues
        let session = await getSession();
        if (!session) {
          // Retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 100));
          session = await getSession();
        }
        
        if (session?.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          const callbackUrl = searchParams?.get("callbackUrl");
          const destination =
            callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
              ? callbackUrl
              : "/";
          router.push(destination);
        }
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
        setError(t("auth.invalidFileType"));
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
    // Reset step to upload when certificate is removed
    if (formData.userType === "professional" && selectedCertificationId) {
      setProfessionalStep("upload");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError(t("auth.nameRequired"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    if (formData.userType === "professional") {
      if (!selectedCertificationId) {
        setError(t("auth.selectCertificationError"));
        return;
      }
      if (!certificateFile) {
        setError(t("auth.certificateRequired"));
        return;
      }
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
        phone: string;
        password: string;
        marketingConsent: boolean;
        userType: string;
        certificate?: string;
        certificationId?: string | null;
        referralCode?: string | null;
      } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        marketingConsent: formData.marketingConsent,
        userType: formData.userType,
      };

      if (certificateUrl) {
        payload.certificate = certificateUrl;
      }

      if (formData.userType === "professional" && selectedCertificationId) {
        payload.certificationId = selectedCertificationId;
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

        const registeredEmail = formData.email.trim().toLowerCase();
        setVerifyEmail(registeredEmail);
        setEmail(registeredEmail);
        setVerificationCode("");
        setError("");
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          marketingConsent: false,
          userType: "customer",
        });
        setCertificateFile(null);
        setSelectedCertificationId(null);
        if (certificatePreview) {
          URL.revokeObjectURL(certificatePreview);
          setCertificatePreview(null);
        }
        setAuthView("verify");
        router.replace(`/login?mode=verify&email=${encodeURIComponent(registeredEmail)}`, {
          scroll: false,
        });
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifyEmail.trim().toLowerCase(),
          code: verificationCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.invalidCode"));
      } else {
        setAuthView("login");
        setEmail(verifyEmail.trim().toLowerCase());
        setVerificationCode("");
        router.push("/login?registered=true", { scroll: false });
      }
    } catch {
      setError(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(data.error || t("auth.errorOccurred"));
      } else if (!res.ok) {
        setError(data.error || t("auth.errorOccurred"));
      } else {
        toast(t("auth.codeResent"), "success", 4000);
      }
    } catch {
      setError(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("auth.errorOccurred"));
      } else {
        toast(t("auth.forgotPasswordSuccess"), "success", 6000);
      }
    } catch {
      setError(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmNewPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.resetPasswordInvalid"));
      } else {
        toast(t("auth.resetPasswordSuccess"), "success", 6000);
        setAuthView("login");
        setNewPassword("");
        setConfirmNewPassword("");
        setResetToken("");
        router.replace("/login", { scroll: false });
      }
    } catch {
      setError(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const authFormCard = (
        <Card
          className={cn(
            "relative z-10 mx-auto w-full max-w-md shrink-0"
          )}
        >
          <CardHeader>
            <CardTitle>
              {authView === "register"
                ? t("auth.register")
                : authView === "verify"
                  ? t("auth.verifyEmailTitle")
                  : authView === "forgot"
                    ? t("auth.forgotPasswordTitle")
                    : authView === "reset"
                      ? t("auth.resetPasswordTitle")
                      : t("auth.login")}
            </CardTitle>
            <CardDescription>
              {authView === "register"
                ? t("auth.signUpDescription")
                : authView === "verify"
                  ? t("auth.verifyEmailDescription", { email: verifyEmail || email })
                  : authView === "forgot"
                    ? t("auth.forgotPasswordDescription")
                    : authView === "reset"
                      ? t("auth.resetPasswordDescription")
                      : t("auth.loginDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authView === "verify" ? (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
                )}
                <div>
                  <label htmlFor="verify-code" className="block text-sm font-medium mb-1">
                    {t("auth.verificationCode")}
                  </label>
                  <Input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    disabled={isLoading}
                    placeholder="000000"
                    className="tracking-[0.35em] text-center text-lg"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length < 6}>
                  {isLoading ? t("auth.verifying") : t("auth.verifyButton")}
                </Button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="w-full text-sm text-gray-600 underline hover:opacity-80"
                >
                  {isLoading ? t("auth.resendingCode") : t("auth.resendCode")}
                </button>
              </form>
            ) : authView === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
                )}
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium mb-1">
                    {t("auth.email")}
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("auth.forgotPasswordSending") : t("auth.forgotPasswordSubmit")}
                </Button>
              </form>
            ) : authView === "reset" ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
                )}
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-1">
                    {t("auth.newPassword")}
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium mb-1">
                    {t("auth.confirmPassword")}
                  </label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("auth.resetPasswordUpdating") : t("auth.resetPasswordSubmit")}
                </Button>
              </form>
            ) : authView === "register" ? (
              // Register Form
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    {t("auth.name")}
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
                    {t("auth.email")}
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
                  <label htmlFor="register-phone" className="block text-sm font-medium mb-1">
                    Telefone
                  </label>
                  <Input
                    id="register-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium mb-1">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((open) => !open)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={isLoading}
                      aria-label={
                        showRegisterPassword ? t("auth.hidePassword") : t("auth.showPassword")
                      }
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    id="marketing-consent"
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) =>
                      setFormData({ ...formData, marketingConsent: e.target.checked })
                    }
                    disabled={isLoading}
                    className="mt-1 h-4 w-4"
                  />
                  <label htmlFor="marketing-consent" className="text-sm text-gray-700">
                    Aceito receber comunicações de marketing (email/SMS).
                  </label>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    {t("auth.confirmPassword")}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((open) => !open)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={isLoading}
                      aria-label={
                        showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("auth.userType")}:
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
                      <span className="text-sm">{t("auth.customer")}</span>
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
                      <span className="text-sm">{t("auth.professional")}</span>
                    </label>
                  </div>
                </div>

                {/* Professional Registration Steps */}
                {formData.userType === "professional" && (
                  <>
                    {/* Step 1: Certification Selection */}
                    {professionalStep === "certification" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("auth.certification")} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedCertificationId || ""}
                          onChange={(e) => setSelectedCertificationId(e.target.value || null)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">{t("auth.selectCertification")}</option>
                          {certifications.map((cert) => (
                            <option key={cert.id} value={cert.id}>
                              {cert.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step 2: Certificate Upload - Only show after certification is selected */}
                    {professionalStep === "upload" && selectedCertificationId && (
                      <div>
                        <div className="mb-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                              ✓
                            </div>
                            <span>{t("auth.certificationSelected")}</span>
                          </div>
                        </div>
                        <label className="block text-sm font-medium mb-2">
                          {t("auth.certificateUpload")} <span className="text-red-500">*</span>
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
                                    {certificateFile?.name || t("auth.certificate")}
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
                                {t("auth.clickToUpload")}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {t("auth.pdfOrImage")}
                              </p>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Complete - Show both when certificate is uploaded */}
                    {professionalStep === "complete" && selectedCertificationId && certificateFile && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                              ✓
                            </div>
                            <span>{t("auth.certificationSelected")}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t("auth.certificateUpload")} <span className="text-red-500">*</span>
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
                                      {certificateFile?.name || t("auth.certificate")}
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
                          ) : null}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    isLoading || 
                    (formData.userType === "professional" && professionalStep !== "complete")
                  }
                >
                  {isLoading ? t("auth.registering") : t("auth.registerButton")}
                </Button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    {t("auth.email")}
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
                    {t("auth.password")}
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
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("forgot");
                      setError("");
                    }}
                    className="text-sm text-gray-600 underline hover:opacity-80"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("auth.loggingIn") : t("auth.loginButton")}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-gray-600">
              {authView === "register" ? (
                <>
                  {t("auth.switchToLogin")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("login");
                      setError("");
                    }}
                    className="inline border-0 bg-transparent p-0 text-sm font-bold leading-inherit text-gray-600 underline hover:opacity-80"
                  >
                    {t("auth.login")}
                  </button>
                </>
              ) : authView === "login" ? (
                <>
                  {t("auth.switchToRegister")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("register");
                      setError("");
                    }}
                    className="inline border-0 bg-transparent p-0 text-sm font-bold leading-inherit text-gray-600 underline hover:opacity-80"
                  >
                    {t("auth.register")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("login");
                    setError("");
                    router.replace("/login", { scroll: false });
                  }}
                  className="inline border-0 bg-transparent p-0 text-sm font-bold leading-inherit text-gray-600 underline hover:opacity-80"
                >
                  {t("auth.backToLogin")}
                </button>
              )}
            </p>
          </CardContent>
        </Card>
  );

  return (
    <>
      <AuthMobileBackground />
      {!layoutReady ? (
        // No data-auth-page yet — that attribute collapses main height under 1024px.
        <div className="relative flex min-h-[calc(100dvh-var(--site-header-height,113px))] w-full items-center justify-center bg-white px-6 py-10">
          <div className="h-48 w-full max-w-md animate-pulse rounded-lg bg-gray-100" aria-hidden />
        </div>
      ) : isMobile ? (
        <>
          <AuthMobileFormPane isExpandedMode={isExpandedMode}>
            {authFormCard}
          </AuthMobileFormPane>
          <div data-auth-page className="hidden" aria-hidden />
        </>
      ) : (
        <div
          data-auth-page
          className="relative flex h-full min-h-0 w-full flex-col overflow-hidden lg:h-[calc(100dvh-var(--site-header-height,113px))] lg:flex-row"
        >
          <div className="relative hidden h-full min-h-0 w-full flex-shrink-0 overflow-hidden bg-[#986858] lg:block lg:w-1/2">
            <Image
              key={LOGIN_DESKTOP_IMAGE}
              src={LOGIN_DESKTOP_IMAGE}
              alt="Bio Sculpture Nail Products"
              fill
              className="object-cover object-center"
              priority
              // Already resized/compressed WebP — serve statically so preload matches LCP URL.
              unoptimized
              sizes="50vw"
            />
          </div>
          <div
            ref={desktopFormScrollRef}
            className="relative z-10 h-full min-h-0 w-full overflow-y-auto overscroll-contain bg-white px-6 lg:w-1/2"
          >
            {/*
              min-h-full + justify-center centers short forms (login).
              When register is taller than the viewport, the inner grows and
              the outer column scrolls the full form without clipping.
            */}
            <div
              className={cn(
                "mx-auto flex min-h-full w-full max-w-md flex-col py-8",
                isExpandedMode ? "justify-start pb-24" : "justify-center"
              )}
            >
              {authFormCard}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-[calc(100dvh-var(--site-header-height,113px))] w-full items-center justify-center bg-white px-6 py-10">
          <div className="h-48 w-full max-w-md animate-pulse rounded-lg bg-gray-100" aria-hidden />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

