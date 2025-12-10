"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  postCaption?: string;
}

export function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  postCaption,
}: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rejectionReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(rejectionReason.trim());
      setRejectionReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRejectionReason("");
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
              Reject Post
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              aria-label="Close rejection modal"
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
              What is incorrect? <span className="text-red-500" aria-label="required">*</span>
            </label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please describe what is incorrect with this post..."
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
              This feedback will be saved as review comments.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

