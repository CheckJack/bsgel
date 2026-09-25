/** Lightweight PT vs EN detector for review copy. */
export function detectReviewLanguage(text: string): "pt" | "en" {
  const sample = String(text || "").toLowerCase().normalize("NFC");
  if (!sample.trim()) return "pt";

  // Strong Portuguese orthography signals
  if (/[ãõáàâéêíóôúç]/.test(sample)) return "pt";

  const ptHits = (
    sample.match(
      /\b(não|nao|com|para|uma|uns|umas|este|esta|isto|muito|produto|adorei|adoro|excelente|qualidade|recomendo|unhas|perfeito|perfeita|bom|boa|melhor|sempre|também|tambem|porque|pois|depois|antes|sobre|entre|sem|mais|menos|aqui|agora|ainda|já|ja|foi|são|sao|está|esta|estou|tem|têm|temos|muito|obrigad[oa]|fantastico|fantástico)\b/g
    ) || []
  ).length;

  const enHits = (
    sample.match(
      /\b(the|and|with|this|that|product|love|loved|great|good|quality|recommend|nails|perfect|amazing|really|very|best|always|because|after|before|about|without|more|less|here|now|still|was|are|is|have|has|thank|thanks|beautiful|wonderful)\b/g
    ) || []
  ).length;

  if (ptHits === 0 && enHits === 0) {
    // Default: Portuguese site audience
    return "pt";
  }

  return ptHits >= enHits ? "pt" : "en";
}

export function oppositeLanguage(lang: "pt" | "en"): "pt" | "en" {
  return lang === "pt" ? "en" : "pt";
}
