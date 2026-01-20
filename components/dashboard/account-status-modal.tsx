"use client";

import { X, CheckCircle2, Clock, Circle, AlertCircle, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { WarningModal } from "./warning-modal";
import { ChangeCertificationModal } from "./change-certification-modal";

interface AccountStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string | null | undefined;
  certification: {
    id: string;
    name: string;
    pending?: boolean;
  } | null;
  certificationId: string | null;
  certificateUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface StatusStep {
  id: string;
  label: string;
  status: "completed" | "pending" | "not_started";
  date?: string;
}

export function AccountStatusModal({
  isOpen,
  onClose,
  userName,
  certification,
  certificationId,
  certificateUrl,
  createdAt,
  updatedAt,
}: AccountStatusModalProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isChangeCertificationModalOpen, setIsChangeCertificationModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Delay hiding for animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const hasCertificationId = !!certificationId;
  const hasCertificateUrl = !!certificateUrl;
  const isApproved = certification && !certification.pending;
  const isPending = hasCertificationId && hasCertificateUrl && !isApproved;
  const canChangeCertification = hasCertificationId || isApproved || isPending;

  const handleChangeCertificationClick = () => {
    setIsWarningModalOpen(true);
  };

  const handleWarningConfirm = () => {
    setIsChangeCertificationModalOpen(true);
  };

  const handleCertificationChangeSuccess = () => {
    // Refresh the page or call a callback to update the parent component
    window.location.reload();
  };

  // Build status steps with dates
  const steps: StatusStep[] = [
    {
      id: "account_created",
      label: t("clientPanel.dashboard.accountStatusModal.accountCreated"),
      status: "completed",
      date: createdAt || undefined,
    },
  ];

  if (hasCertificationId) {
    // For certification selected, use createdAt as fallback (since we don't have exact date)
    // If user has certificateUrl, updatedAt likely represents when certificate was uploaded
    // So we'll use a date between createdAt and updatedAt, or just use createdAt
    const certificationSelectedDate = hasCertificateUrl && updatedAt ? 
      (new Date(updatedAt) > new Date(createdAt || 0) ? createdAt : updatedAt) : 
      (createdAt || updatedAt);
    
    steps.push({
      id: "certification_selected",
      label: t("clientPanel.dashboard.accountStatusModal.certificationSelected", {
        name: certification?.name || "Certification",
      }),
      status: "completed",
      date: certificationSelectedDate || undefined,
    });
  }

  if (hasCertificateUrl) {
    // Use updatedAt for certificate upload date, fallback to createdAt
    steps.push({
      id: "certificate_uploaded",
      label: t("clientPanel.dashboard.accountStatusModal.certificateUploaded"),
      status: "completed",
      date: updatedAt || createdAt || undefined,
    });
  }

  if (isPending) {
    steps.push({
      id: "under_review",
      label: t("clientPanel.dashboard.accountStatusModal.underReview"),
      status: "pending",
      date: updatedAt || undefined, // When it went into review
    });
  } else if (isApproved) {
    steps.push({
      id: "approved",
      label: t("clientPanel.dashboard.accountStatusModal.certificationApproved"),
      status: "completed",
      date: updatedAt || undefined, // When it was approved
    });
  }

  const getStepIcon = (status: StatusStep["status"]) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
        );
      case "pending":
        return (
          <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400 animate-pulse" />
        );
      default:
        return (
          <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        );
    }
  };

  const getStepColor = (status: StatusStep["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
            {t("clientPanel.dashboard.accountStatusModal.underReview")}
          </span>
        </div>
      );
    } else if (isApproved) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            {t("clientPanel.dashboard.accountStatusModal.approved")}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {t("clientPanel.dashboard.active")}
          </span>
        </div>
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("clientPanel.dashboard.accountStatusModal.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {userName || "User"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={t("clientPanel.dashboard.accountStatusModal.close")}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <CardContent className="p-6 overflow-y-auto flex-1">

          {/* Status Badge */}
          <div className="mb-6 mt-0">{getStatusBadge()}</div>

          {/* Certification Info */}
          {certification && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t("clientPanel.dashboard.accountStatusModal.certificationDetails")}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{t("clientPanel.dashboard.accountStatusModal.certification")}:</span>{" "}
                {certification.name}
              </p>
              {certificateUrl && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t("clientPanel.dashboard.accountStatusModal.certificateUploadedMessage")}
                </p>
              )}
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("clientPanel.dashboard.accountStatusModal.statusHistory")}
            </h3>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

              {/* Steps */}
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                        {getStepIcon(step.status)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <p
                        className={`text-base font-medium ${getStepColor(
                          step.status
                        )}`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.date 
                          ? new Date(step.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : new Date().toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                        }
                      </p>
                      {step.status === "pending" && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                          {t("clientPanel.dashboard.accountStatusModal.underReviewMessage")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Info for Pending Status */}
          {isPending && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-1">
                    {t("clientPanel.dashboard.accountStatusModal.underReviewTitle")}
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    {t("clientPanel.dashboard.accountStatusModal.underReviewDescription", {
                      name: userName || "You",
                      certificationName: certification?.name || "Certification",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info for Approved Status */}
          {isApproved && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-1">
                    {t("clientPanel.dashboard.accountStatusModal.approvedTitle")}
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    {t("clientPanel.dashboard.accountStatusModal.approvedDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {canChangeCertification && (
              <Button
                type="button"
                variant="outline"
                onClick={handleChangeCertificationClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t("clientPanel.dashboard.accountStatusModal.changeCertification")}
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              className="ml-auto bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
            >
              {t("clientPanel.dashboard.accountStatusModal.close")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warning Modal */}
      <WarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={handleWarningConfirm}
        title={t("clientPanel.dashboard.warningModal.changeCertificationTitle")}
        message={t("clientPanel.dashboard.warningModal.changeCertificationMessage")}
      />

      {/* Change Certification Modal */}
      <ChangeCertificationModal
        isOpen={isChangeCertificationModalOpen}
        onClose={() => setIsChangeCertificationModalOpen(false)}
        onSuccess={handleCertificationChangeSuccess}
        currentCertificationId={certificationId}
      />
    </div>
  );
}

