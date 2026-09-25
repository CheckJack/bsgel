import { NextResponse } from "next/server";

interface TranslateRequest {
  texts: string[];
  target?: string;
}

function normalizeTarget(target: unknown): "pt" | "en" {
  const value = String(target || "pt").toLowerCase();
  return value.startsWith("en") ? "en" : "pt";
}

function extractTranslation(data: unknown): { text: string; detected?: string } {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return { text: "" };
  }

  const text = data[0]
    .map((chunk: unknown) => (Array.isArray(chunk) ? String(chunk[0] ?? "") : ""))
    .join("");

  const detected =
    typeof data[2] === "string" && data[2].trim() ? data[2].trim().toLowerCase() : undefined;

  return { text, detected };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranslateRequest;
    const texts = Array.isArray(body.texts) ? body.texts.map((t) => String(t ?? "")) : [];
    const target = normalizeTarget(body.target);

    if (texts.length === 0) {
      return NextResponse.json({ translations: [], detectedLanguages: [], target });
    }

    const results = await Promise.all(
      texts.map(async (text) => {
        if (!text.trim()) {
          return { text: text || "", detected: undefined as string | undefined };
        }

        const url =
          "https://translate.googleapis.com/translate_a/single" +
          `?client=gtx&sl=auto&tl=${encodeURIComponent(target)}` +
          `&dt=t&q=${encodeURIComponent(text)}`;

        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; BioSculptureShop/1.0; +https://biosculpture.pt)",
          },
        });

        if (!res.ok) {
          return { text, detected: undefined };
        }

        const data = await res.json();
        const extracted = extractTranslation(data);
        return {
          text: extracted.text || text,
          detected: extracted.detected,
        };
      })
    );

    return NextResponse.json({
      translations: results.map((r) => r.text),
      detectedLanguages: results.map((r) => r.detected || null),
      target,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Falha ao traduzir texto";
    console.error("Falha ao traduzir texto:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
