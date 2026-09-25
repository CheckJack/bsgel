export const ADMIN_AI_UNDO_TTL_MS = 60 * 60 * 1000; // 1 hour
export const ADMIN_AI_PENDING_TTL_MS = 30 * 60 * 1000; // 30 min to confirm
export const ADMIN_AI_MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
export const ADMIN_AI_MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ADMIN_AI_MAX_HISTORY_MESSAGES = 24;

export function isAdminAiEnabled(): boolean {
  return process.env.ENABLE_ADMIN_AI === "true";
}

export function isAdminAiEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ADMIN_AI === "true";
}

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

const DEPRECATED_GEMINI_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-001",
  "gemini-2.5-flash-lite",
]);

function resolveGeminiModel(name: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed && !DEPRECATED_GEMINI_MODELS.has(trimmed)) return trimmed;
  return "gemini-3.1-flash-lite";
}

export function getGeminiModel(): string {
  return resolveGeminiModel(process.env.GEMINI_MODEL);
}

/** Models to try when the primary fails (503 or unavailable model). */
export function getGeminiModelCandidates(): string[] {
  const primary = getGeminiModel();
  const fallbacks = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ]
    .map((m) => resolveGeminiModel(m))
    .filter((m) => !DEPRECATED_GEMINI_MODELS.has(m));
  return Array.from(new Set([primary, ...fallbacks.filter((m) => m !== primary)]));
}

export function isRetryableGeminiError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /503|429|500|high demand|unavailable|overloaded|try again/i.test(msg);
}

/** Model missing or deprecated for this API key — try the next candidate immediately. */
export function isUnavailableGeminiModelError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /404|not found|no longer available|not available to new users/i.test(msg);
}
