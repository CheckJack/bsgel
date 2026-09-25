export type AdminAiPreviewRow = {
  label: string;
  before?: string;
  after?: string;
  detail?: string;
};

export type AdminAiRichPreview = {
  title: string;
  summary: string;
  rows: AdminAiPreviewRow[];
  toolName: string;
};

export type AdminAiActionLink = {
  label: string;
  href: string;
};

export type AdminAiAttachment = {
  fileName: string;
  mimeType: string;
  size: number;
  kind: "pdf" | "image";
  extractedText?: string;
  imageBase64?: string;
};

export type AdminAiPendingActionMeta = {
  id: string;
  toolName: string;
  preview?: AdminAiRichPreview;
  links?: AdminAiActionLink[];
  expiresAt?: string;
};

export type AdminAiChatMessageMeta = {
  pendingActionId?: string;
  pendingActions?: AdminAiPendingActionMeta[];
  toolName?: string;
  preview?: AdminAiRichPreview;
  undoId?: string;
  undoDescription?: string;
  undoExpiresAt?: string;
  links?: AdminAiActionLink[];
  isError?: boolean;
  isSuccess?: boolean;
  variant?: "assistant" | "error" | "success" | "system";
};
