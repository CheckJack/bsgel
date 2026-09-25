/** Strip markdown to plain text for copy / speech. */
export function messageToPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

let activeSpeakId: string | null = null;

function voiceScore(voice: SpeechSynthesisVoice, langPrefix: string): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;
  if (lang.startsWith(langPrefix)) score += 10;
  if (/pt|portugu/i.test(lang) && langPrefix === "pt") score += 5;
  if (/en|english/i.test(lang) && langPrefix === "en") score += 5;
  // Prefer younger / brighter voices when available
  if (/samantha|karen|tessa|moira|fiona|joana|luciana|ines|maria|female|woman|girl|young/i.test(name)) {
    score += 8;
  }
  if (/google.*(female|mulher)/i.test(name)) score += 6;
  if (voice.localService) score += 1;
  return score;
}

export function pickSpeechVoice(langPrefix: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const sorted = [...voices].sort((a, b) => voiceScore(b, langPrefix) - voiceScore(a, langPrefix));
  return sorted[0] ?? null;
}

export type SpeakOptions = {
  messageId: string;
  text: string;
  langPrefix: string;
  onStart?: () => void;
  onEnd?: () => void;
};

export function speakMessage({ messageId, text, langPrefix, onStart, onEnd }: SpeakOptions): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  const plain = messageToPlainText(text);
  if (!plain) return false;

  if (activeSpeakId === messageId && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    activeSpeakId = null;
    onEnd?.();
    return true;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(plain);
  const voice = pickSpeechVoice(langPrefix);
  if (voice) utterance.voice = voice;
  utterance.lang = langPrefix === "pt" ? "pt-PT" : "en-US";
  utterance.rate = 1.05;
  utterance.pitch = 1.12;

  utterance.onstart = () => {
    activeSpeakId = messageId;
    onStart?.();
  };
  utterance.onend = () => {
    if (activeSpeakId === messageId) activeSpeakId = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    if (activeSpeakId === messageId) activeSpeakId = null;
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeSpeakId = null;
  }
}

export function ensureSpeechVoicesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve();
    }, 500);
  });
}
