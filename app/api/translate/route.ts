import { NextResponse } from "next/server";

interface TranslateRequest {
  texts: string[];
  target?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranslateRequest;
    const texts = Array.isArray(body.texts) ? body.texts : [];
    const target = body.target || "pt";

    if (texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    const translations = await Promise.all(
      texts.map(async (text) => {
        if (!text?.trim()) return text || "";

        const url =
          "https://translate.googleapis.com/translate_a/single" +
          `?client=gtx&sl=auto&tl=${encodeURIComponent(target)}` +
          `&dt=t&q=${encodeURIComponent(text)}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return text;

        const data = await res.json();
        if (!Array.isArray(data?.[0])) return text;

        const translated = data[0]
          .map((chunk: any) => (Array.isArray(chunk) ? chunk[0] : ""))
          .join("");

        return translated || text;
      })
    );

    return NextResponse.json({ translations });
  } catch (error: any) {
    console.error("Falha ao traduzir texto:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao traduzir texto" },
      { status: 500 }
    );
  }
}
