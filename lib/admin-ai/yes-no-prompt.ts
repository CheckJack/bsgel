export const HOLO_YES_NO_MARKER = "[[HOLO_YES_NO]]";

const YES_NO_PATTERNS = [
  /\bshould i\b/i,
  /\bshall i\b/i,
  /\bwould you like\b/i,
  /\bdo you want\b/i,
  /\bcan i\b/i,
  /\bmay i\b/i,
  /\bproceed\b/i,
  /\bis that (ok|correct|right|fine)\b/i,
  /\bconfirm\b/i,
  /\bgo ahead\b/i,
  /\bwant me to\b/i,
  /\bready to\b/i,
  /\bshall we\b/i,
  /\bdevo\b/i,
  /\bposso\b/i,
  /\bquer(?:e)?s?\s+que\b/i,
  /\bpretende\b/i,
  /\bconfirma\b/i,
  /\bavançar\b/i,
  /\bprosseguir\b/i,
  /\bcontinuar\b/i,
  /\bestá\s+bem\b/i,
  /\bestá\s+correcto\b/i,
];

export function stripYesNoMarker(content: string): string {
  return content.replace(new RegExp(`\\s*${escapeRegex(HOLO_YES_NO_MARKER)}\\s*`, "g"), "").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasYesNoMarker(content: string): boolean {
  return content.includes(HOLO_YES_NO_MARKER);
}

export function looksLikeYesNoQuestion(content: string): boolean {
  const stripped = stripYesNoMarker(content);
  if (!stripped.includes("?")) return false;

  const tail = stripped.slice(-400);
  const matches = YES_NO_PATTERNS.filter((p) => p.test(tail));
  // Require at least two pattern hits to reduce false positives on generic questions
  return matches.length >= 2;
}

export function isYesNoPrompt(content: string): boolean {
  return hasYesNoMarker(content) || looksLikeYesNoQuestion(content);
}

export function getYesReply(lang: "en" | "pt"): string {
  return lang === "pt" ? "Sim, pode avançar." : "Yes, please proceed.";
}

export function getNoReply(lang: "en" | "pt"): string {
  return lang === "pt"
    ? "Não. Diz-me o que queres alterar antes de avançarmos."
    : "No. Please tell me what you'd like changed before we proceed.";
}
