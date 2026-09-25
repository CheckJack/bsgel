"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  postCaption?: string;
  title?: string;
  reasonLabel?: string;
  placeholder?: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  helpText?: string;
  emptyError?: string;
}

export function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  postCaption,
  title,
  reasonLabel,
  placeholder,
  confirmLabel,
  confirmingLabel,
  helpText,
  emptyError,
}: RejectionModalProps) {
  const { t } = useLanguage();
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rejectionReason.trim()) {
      setShowEmptyError(true);
      return;
    }

    setIsSubmitting(true);
    setShowEmptyError(false);
    try {
      await onConfirm(rejectionReason.trim());
      setRejectionReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRejectionReason("");
    setShowEmptyError(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-modal-title"
    >
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle
              id="rejection-modal-title"
              className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <XCircle className="h-5 w-5" aria-hidden="true" />
              {title || t("admin.rejectionModal.title")}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              aria-label={t("admin.rejectionModal.close")}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {postCaption && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Post Caption:
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {postCaption}
              </p>
            </div>
          )}
          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              {reasonLabel || t("admin.rejectionModal.reasonLabel")}{" "}
              <span className="text-red-500" aria-label="required">
                *
              </span>
            </label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (showEmptyError && e.target.value.trim()) {
                  setShowEmptyError(false);
                }
              }}
              placeholder={
                placeholder || t("admin.rejectionModal.reasonPlaceholder")
              }
              rows={5}
              className="w-full"
              autoFocus
              aria-required="true"
              aria-describedby="rejection-reason-help"
            />
            <p
              id="rejection-reason-help"
              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {helpText ||
                "This feedback will be saved as review comments."}
            </p>
            {showEmptyError && emptyError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                {emptyError}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              {isSubmitting
                ? confirmingLabel || t("admin.rejectionModal.rejecting")
                : confirmLabel || t("admin.rejectionModal.confirm")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
