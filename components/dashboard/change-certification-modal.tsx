"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useSession } from "next-auth/react";

interface ChangeCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCertificationId: string | null;
}

interface Certification {
  id: string;
  name: string;
}

export function ChangeCertificationModal({
  isOpen,
  onClose,
  onSuccess,
  currentCertificationId,
}: ChangeCertificationModalProps) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertificationId, setSelectedCertificationId] = useState<string>("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCertifications, setIsFetchingCertifications] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      fetchCertifications();
      setError("");
      setCertificateFile(null);
      setCertificatePreview(null);
      setSelectedCertificationId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fetchCertifications = async () => {
    setIsFetchingCertifications(true);
    try {
      const res = await fetch("/api/certifications?public=true&isActive=true");
      if (res.ok) {
        const data = await res.json();
        setCertifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch certifications:", error);
      setError(t("clientPanel.dashboard.changeCertificationModal.errorFetchingCertifications"));
    } finally {
      setIsFetchingCertifications(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError(t("clientPanel.dashboard.changeCertificationModal.fileTooLarge"));
        return;
      }

      setCertificateFile(file);
      setError("");

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCertificatePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setCertificatePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedCertificationId) {
      setError(t("clientPanel.dashboard.changeCertificationModal.selectCertificationError"));
      return;
    }

    if (!certificateFile) {
      setError(t("clientPanel.dashboard.changeCertificationModal.uploadCertificateError"));
      return;
    }

    if (!session?.user?.id) {
      setError(t("clientPanel.dashboard.changeCertificationModal.unauthorized"));
      return;
    }

    setIsLoading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const certificateUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read certificate file"));
        };
        reader.readAsDataURL(certificateFile);
      });

      // Submit to API
      const res = await fetch(`/api/users/${session.user.id}/certification/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificationId: selectedCertificationId,
          certificate: certificateUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("clientPanel.dashboard.changeCertificationModal.submitError"));
        return;
      }

      // Success
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update certification:", error);
      setError(t("clientPanel.dashboard.changeCertificationModal.submitError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <Card
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 flex flex-col ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("clientPanel.dashboard.changeCertificationModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={t("clientPanel.dashboard.accountStatusModal.close")}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <CardContent className="p-6 space-y-6">
            {/* Warning */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  {t("clientPanel.dashboard.changeCertificationModal.warningMessage")}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Certification Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.dashboard.changeCertificationModal.selectCertification")}{" "}
                <span className="text-red-500">*</span>
              </label>
              {isFetchingCertifications ? (
                <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-sm text-gray-500">{t("common.loading")}</p>
                </div>
              ) : (
                <select
                  value={selectedCertificationId}
                  onChange={(e) => setSelectedCertificationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">
                    {t("clientPanel.dashboard.changeCertificationModal.selectPlaceholder")}
                  </option>
                  {certifications.map((cert) => (
                    <option key={cert.id} value={cert.id}>
                      {cert.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("clientPanel.dashboard.changeCertificationModal.uploadCertificate")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="certificate-file"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                    >
                      <span>{t("clientPanel.dashboard.changeCertificationModal.uploadFile")}</span>
                      <input
                        ref={fileInputRef}
                        id="certificate-file"
                        name="certificate-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="sr-only"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("clientPanel.dashboard.changeCertificationModal.fileTypes")}
                  </p>
                </div>
              </div>

              {certificateFile && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("clientPanel.dashboard.changeCertificationModal.selectedFile")}:{" "}
                    <span className="font-medium">{certificateFile.name}</span>
                  </p>
                  {certificatePreview && (
                    <div className="mt-2">
                      <img
                        src={certificatePreview}
                        alt="Certificate preview"
                        className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedCertificationId || !certificateFile}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading
                  ? t("common.saving")
                  : t("clientPanel.dashboard.changeCertificationModal.submit")}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

