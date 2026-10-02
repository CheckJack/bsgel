import path from "node:path";
import { pathToFileURL } from "node:url";

declare const __non_webpack_require__: NodeRequire | undefined;

function nodeRequire(): NodeRequire {
  if (typeof __non_webpack_require__ === "function") {
    return __non_webpack_require__;
  }
  // Outside Next webpack (tests / scripts)
  return Function("return require")() as NodeRequire;
}

function loadPdfParse(): typeof import("pdf-parse") {
  return nodeRequire()("pdf-parse");
}

function workerFileUrl(): string {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "worker",
    "pdf.worker.mjs"
  );
  return pathToFileURL(workerPath).href;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = loadPdfParse();
  PDFParse.setWorker(workerFileUrl());

  const data = new Uint8Array(buffer);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text?.trim() || "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

export function truncateContext(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[…truncated…]";
}
