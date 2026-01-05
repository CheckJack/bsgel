"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, Mail, FileText, Upload } from "lucide-react";
import { toast, handleApiError } from "@/lib/utils";

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  pdfUrl?: string | null;
  scheduledDate: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SCHEDULED" | "SENT";
  reviewComments?: string;
  assignedReviewerId?: string;
  recipientList: string[];
  recipientType: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCampaign: EmailCampaign | null;
  onSave: () => void;
  adminUsers: Array<{ id: string; name: string | null; email: string }>;
  isLoadingAdmins: boolean;
  defaultScheduledDate?: Date;
}

export function EmailCampaignModal({
  isOpen,
  onClose,
  editingCampaign,
  onSave,
  adminUsers,
  isLoadingAdmins,
  defaultScheduledDate,
}: EmailCampaignModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    scheduledDate: "",
    scheduledTime: "",
    status: "DRAFT" as EmailCampaign["status"],
    recipientType: "ALL",
    recipientList: [] as string[],
    recipientInput: "",
    assignedReviewerId: "",
  });

  useEffect(() => {
    if (editingCampaign) {
      const scheduledDate = editingCampaign.scheduledDate
        ? new Date(editingCampaign.scheduledDate)
        : null;
      setFormData({
        subject: editingCampaign.subject,
        content: editingCampaign.content,
        scheduledDate: scheduledDate
          ? scheduledDate.toISOString().slice(0, 10)
          : "",
        scheduledTime: scheduledDate
          ? scheduledDate.toTimeString().slice(0, 5)
          : "",
        status: editingCampaign.status,
        recipientType: editingCampaign.recipientType,
        recipientList: editingCampaign.recipientList,
        recipientInput: "",
        assignedReviewerId: editingCampaign.assignedReviewerId || "",
      });
      setPdfUrl(editingCampaign.pdfUrl || null);
      setPdfFile(null);
    } else {
      const now = defaultScheduledDate || new Date();
      setFormData({
        subject: "",
        content: "",
        scheduledDate: now.toISOString().slice(0, 10),
        scheduledTime: now.toTimeString().slice(0, 5),
        status: "DRAFT",
        recipientType: "ALL",
        recipientList: [],
        recipientInput: "",
        assignedReviewerId: "",
      });
      setPdfUrl(null);
      setPdfFile(null);
    }
    setError(null);
  }, [editingCampaign, isOpen, defaultScheduledDate]);

  const handleAddRecipient = () => {
    if (formData.recipientInput.trim()) {
      const email = formData.recipientInput.trim();
      if (!formData.recipientList.includes(email)) {
        setFormData({
          ...formData,
          recipientList: [...formData.recipientList, email],
          recipientInput: "",
        });
      } else {
        toast("Email already in list", "error");
      }
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData({
      ...formData,
      recipientList: formData.recipientList.filter((_, i) => i !== index),
    });
  };

  const uploadPdfFile = async (file: File) => {
    // Validate file type
    if (file.type !== "application/pdf") {
      toast("Please upload a PDF file", "error");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast("PDF file size must be less than 50MB", "error");
      return;
    }

    setIsUploadingPdf(true);
    setPdfFile(file);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("action", "upload");
      uploadFormData.append("file", file);
      uploadFormData.append("folderId", "");

      const res = await fetch("/api/gallery", {
        method: "POST",
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        setPdfUrl(data.url || data.item?.url);
        // Clear HTML content when PDF is uploaded (mutually exclusive)
        setFormData((prev) => ({ ...prev, content: "" }));
        toast("PDF uploaded successfully. HTML content cleared.", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload PDF");
      }
    } catch (error: any) {
      console.error("Failed to upload PDF:", error);
      toast(error.message || "Failed to upload PDF", "error");
      setPdfFile(null);
      setPdfUrl(null);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPdfFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (pdfUrl) {
      toast("Please remove the existing PDF first", "error");
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await uploadPdfFile(file);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    // If user starts typing HTML content and PDF exists, clear PDF
    if (newContent.trim() && pdfUrl) {
      if (confirm("Adding HTML content will remove the PDF. Continue?")) {
        setPdfUrl(null);
        setPdfFile(null);
        setFormData({ ...formData, content: newContent });
      }
    } else {
      setFormData({ ...formData, content: newContent });
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfUrl(null);
    // Re-enable HTML content when PDF is removed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.subject.trim()) {
      setError("Subject is required");
      return;
    }

    // Both are optional, but if neither is provided, show a warning (not blocking)
    // The user can save with just a subject if needed

    if (formData.status === "PENDING_REVIEW" && !formData.assignedReviewerId) {
      setError("Please select a reviewer when submitting for review");
      return;
    }

    if (formData.recipientType === "CUSTOM" && formData.recipientList.length === 0) {
      setError("Please add at least one recipient email for custom list");
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledDateTime = formData.scheduledDate && formData.scheduledTime
        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
        : null;

      // Ensure mutual exclusivity: if PDF exists, clear content; if content exists, clear PDF
      const finalContent = pdfUrl ? "" : formData.content;
      const finalPdfUrl = formData.content.trim() ? null : (pdfUrl || null);

      const payload = {
        subject: formData.subject,
        content: finalContent,
        pdfUrl: finalPdfUrl,
        scheduledDate: scheduledDateTime ? scheduledDateTime.toISOString() : null,
        status: formData.status,
        recipientType: formData.recipientType,
        recipientList: formData.recipientType === "CUSTOM" ? formData.recipientList : [],
        assignedReviewerId: formData.status === "PENDING_REVIEW" ? formData.assignedReviewerId : undefined,
      };

      const url = editingCampaign
        ? `/api/email-campaigns/${editingCampaign.id}`
        : "/api/email-campaigns";
      const method = editingCampaign ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast(
          editingCampaign
            ? "Campaign updated successfully"
            : "Campaign created successfully",
          "success"
        );
        onSave();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error || "Failed to save campaign" };
      }
    } catch (error) {
      console.error("Failed to save campaign:", error);
      handleApiError(error, "save campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {editingCampaign ? "Edit Email Campaign" : "Create Email Campaign"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Email subject line"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Content (HTML) {pdfUrl && <span className="text-xs text-gray-500">(disabled when PDF is uploaded)</span>}
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={handleContentChange}
                placeholder={pdfUrl ? "PDF is uploaded. Remove PDF to add HTML content." : "Enter HTML email content..."}
                rows={12}
                disabled={!!pdfUrl}
                className={`font-mono text-sm ${pdfUrl ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : ""}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {pdfUrl 
                  ? "HTML content is disabled when PDF is uploaded. Remove PDF to add HTML content."
                  : "You can use HTML tags to format your email content, or upload a PDF instead (mutually exclusive)"}
              </p>
            </div>

            <div>
              <label htmlFor="pdf-upload" className="block text-sm font-medium mb-1">
                PDF File {formData.content.trim() && <span className="text-xs text-gray-500">(disabled when HTML content exists)</span>}
              </label>
              <div className="space-y-2">
                {pdfUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {pdfFile?.name || "View PDF"}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePdf}
                      className="text-red-600 dark:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex items-center justify-center gap-2 h-32 px-4 border-2 border-dashed rounded-md transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : formData.content.trim()
                        ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    } ${isUploadingPdf ? "cursor-wait" : formData.content.trim() ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <label
                      htmlFor="pdf-upload"
                      className={`flex flex-col items-center justify-center gap-2 w-full h-full ${formData.content.trim() ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {isUploadingPdf ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className={`h-6 w-6 ${isDragOver ? "text-blue-500" : "text-gray-400"}`} />
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {formData.content.trim() 
                                ? "Clear HTML content to upload PDF"
                                : isDragOver 
                                ? "Drop PDF here" 
                                : "Click to upload or drag and drop"}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              PDF file (max 50MB)
                            </p>
                          </div>
                        </>
                      )}
                      <input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        disabled={isUploadingPdf || !!formData.content.trim()}
                      />
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload a PDF file (max 50MB). PDF and HTML content are mutually exclusive - choose one or the other.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduled-date" className="block text-sm font-medium mb-1">
                  Scheduled Date
                </label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="scheduled-time" className="block text-sm font-medium mb-1">
                  Scheduled Time
                </label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="recipient-type" className="block text-sm font-medium mb-1">
                Recipient Type
              </label>
              <select
                id="recipient-type"
                value={formData.recipientType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recipientType: e.target.value,
                    recipientList: e.target.value !== "CUSTOM" ? [] : formData.recipientList,
                  })
                }
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="ALL">All Users</option>
                <option value="SEGMENT">Segment</option>
                <option value="CUSTOM">Custom List</option>
              </select>
            </div>

            {formData.recipientType === "CUSTOM" && (
              <div>
                <label htmlFor="recipient-input" className="block text-sm font-medium mb-1">
                  Recipient Emails
                </label>
                <div className="flex gap-2">
                  <Input
                    id="recipient-input"
                    type="email"
                    value={formData.recipientInput}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientInput: e.target.value })
                    }
                    placeholder="Enter email address"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddRecipient}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                {formData.recipientList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.recipientList.map((email, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as EmailCampaign["status"],
                    assignedReviewerId: e.target.value !== "PENDING_REVIEW" ? "" : formData.assignedReviewerId,
                  })
                }
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>
            </div>

            {formData.status === "PENDING_REVIEW" && (
              <div>
                <label htmlFor="reviewer" className="block text-sm font-medium mb-1">
                  Assign Reviewer <span className="text-red-500">*</span>
                </label>
                {isLoadingAdmins ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading reviewers...
                  </div>
                ) : (
                  <select
                    id="reviewer"
                    value={formData.assignedReviewerId}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedReviewerId: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select a reviewer</option>
                    {adminUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCampaign ? "Update Campaign" : "Create Campaign"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

