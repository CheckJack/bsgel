import PDFDocument from "pdfkit";
import { formatPrice } from "@/lib/utils";
import { parseOrderShippingAddress } from "@/lib/parse-order-shipping-address";
import fs from "node:fs";
import path from "node:path";

const PDFKIT_AFM_FILES = [
  "Courier.afm",
  "Courier-Bold.afm",
  "Courier-BoldOblique.afm",
  "Courier-Oblique.afm",
  "Helvetica.afm",
  "Helvetica-Bold.afm",
  "Helvetica-BoldOblique.afm",
  "Helvetica-Oblique.afm",
  "Symbol.afm",
  "Times-Bold.afm",
  "Times-BoldItalic.afm",
  "Times-Italic.afm",
  "Times-Roman.afm",
  "ZapfDingbats.afm",
] as const;

let pdfKitFontDataReady = false;

function ensurePdfKitFontData() {
  if (pdfKitFontDataReady) return;

  try {
    const sourceDir = path.join(process.cwd(), "node_modules", "pdfkit", "js", "data");
    const targetDir = path.join(process.cwd(), ".next", "server", "chunks", "data");

    const hasSource = fs.existsSync(sourceDir);
    if (!hasSource) return;

    fs.mkdirSync(targetDir, { recursive: true });

    for (const filename of PDFKIT_AFM_FILES) {
      const source = path.join(sourceDir, filename);
      const target = path.join(targetDir, filename);
      if (!fs.existsSync(source) || fs.existsSync(target)) continue;
      fs.copyFileSync(source, target);
    }

    pdfKitFontDataReady = true;
  } catch (error) {
    // Best-effort guard for production bundling quirks.
    console.warn("Failed to ensure pdfkit font data:", error);
  }
}

export type InvoiceLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  kind?: "product" | "training";
};

export type InvoiceData = {
  orderId: string;
  createdAt: Date;
  customerName?: string | null;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  billingNif?: string | null;
  billingAddress?: string | null;
  paymentMethodLabel: string;
  items: InvoiceLineItem[];
  shippingAmount: number;
  taxAmount: number;
  taxRate?: number | null;
  total: number;
  /** Paid invoice vs unpaid order summary / proforma */
  documentType?: "invoice" | "proforma";
};

const SELLER = {
  name: "BS Gel, Lda. — Bio Sculpture Portugal",
  email: "info@biosculpture.pt",
  phone: "+351 935 172 295",
  website: "biosculpture.pt",
};
const LOGO_PATH = path.join(process.cwd(), "public", "bio-sculpture-black.png");

function num(v: number): string {
  return formatPrice(v);
}

function collectBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

/**
 * Generate a simple A4 PDF invoice / proforma for an order.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  ensurePdfKitFontData();
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const done = collectBuffer(doc);
  const orderShort = data.orderId.slice(0, 8).toUpperCase();
  const isProforma = data.documentType === "proforma";
  const title = isProforma ? "PROFORMA / ENCOMENDA" : "FATURA / INVOICE";
  const pageLeft = 50;
  const pageRight = 545;
  const pageWidth = pageRight - pageLeft;

  // Header with logo + identity
  const logoTop = 42;
  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, pageLeft, logoTop, { fit: [190, 40] });
    } catch {
      // Ignore logo drawing failures to avoid blocking invoice creation.
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#1a1a1a")
    .text(title, pageLeft, 95, { width: 300 });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#555")
    .text(`${isProforma ? "Encomenda" : "Fatura"} #${orderShort}`, 360, 58, { width: 185, align: "right" })
    .text(`Data: ${data.createdAt.toLocaleDateString("pt-PT")}`, 360, 74, { width: 185, align: "right" });
  doc
    .moveTo(pageLeft, 122)
    .lineTo(pageRight, 122)
    .lineWidth(1)
    .strokeColor("#e3e3e3")
    .stroke();

  // Seller + customer cards
  const cardTop = 138;
  const cardGap = 14;
  const cardWidth = (pageWidth - cardGap) / 2;
  const cardHeight = 122;
  const leftCardX = pageLeft;
  const rightCardX = pageLeft + cardWidth + cardGap;

  doc
    .rect(leftCardX, cardTop, cardWidth, cardHeight)
    .fillAndStroke("#fafafa", "#ebebeb");
  doc
    .rect(rightCardX, cardTop, cardWidth, cardHeight)
    .fillAndStroke("#fafafa", "#ebebeb");

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a1a1a").text("Vendedor / Seller", leftCardX + 12, cardTop + 12);
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#333")
    .text(SELLER.name, leftCardX + 12, cardTop + 30, { width: cardWidth - 24 })
    .text(SELLER.email, leftCardX + 12, cardTop + 58, { width: cardWidth - 24 })
    .text(SELLER.phone, leftCardX + 12, cardTop + 73, { width: cardWidth - 24 })
    .text(SELLER.website, leftCardX + 12, cardTop + 88, { width: cardWidth - 24 });

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a1a1a").text("Cliente / Customer", rightCardX + 12, cardTop + 12);
  doc.font("Helvetica").fontSize(9.5).fillColor("#333");
  let customerY = cardTop + 30;
  const customerMaxY = cardTop + cardHeight - 14;
  const writeCustomerLine = (value?: string | null) => {
    if (!value) return;
    if (customerY > customerMaxY) return;
    doc.text(value, rightCardX + 12, customerY, { width: cardWidth - 24 });
    customerY = doc.y + 1;
  };

  const shipping = parseOrderShippingAddress(data.shippingAddress);
  if (shipping) {
    writeCustomerLine(shipping.name || data.customerName || "—");
    writeCustomerLine(shipping.email || data.customerEmail || "");
    writeCustomerLine(shipping.phone || "");
    for (const line of shipping.addressLines.slice(0, 2)) writeCustomerLine(line);
    writeCustomerLine(shipping.postalCity || "");
    writeCustomerLine(shipping.country || "");
  } else {
    writeCustomerLine(data.customerName || "—");
    writeCustomerLine(data.customerEmail || "");
    if (data.shippingAddress) {
      for (const line of data.shippingAddress.split("\n").filter(Boolean).slice(0, 4)) {
        writeCustomerLine(line);
      }
    }
  }

  doc.font("Helvetica").fontSize(10).fillColor("#555");
  doc.text(`Método de pagamento: ${data.paymentMethodLabel}`, pageLeft, cardTop + cardHeight + 10, {
    width: pageWidth,
  });

  if (data.billingNif || data.billingAddress) {
    const billingTop = cardTop + cardHeight + 28;
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1a1a1a").text("Faturação / Billing", pageLeft, billingTop);
    doc.font("Helvetica").fontSize(9).fillColor("#555");
    if (data.billingNif) doc.text(`NIF: ${data.billingNif}`, pageLeft + 92, billingTop, { width: pageWidth - 92 });
    if (data.billingAddress) {
      const firstLine = data.billingAddress.split("\n").filter(Boolean)[0];
      if (firstLine) doc.text(firstLine, pageLeft, billingTop + 12, { width: pageWidth });
    }
    doc.y = billingTop + 26;
  }

  if (isProforma) {
    doc.moveDown(0.2);
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#8a6d00")
      .text("Documento provisório — aguarda confirmação de pagamento. Não constitui fatura fiscal.");
  }

  doc.moveDown(0.8);

  const tableTop = doc.y;
  const colItem = pageLeft;
  const colQty = 320;
  const colUnit = 370;
  const colTotal = 460;

  doc.rect(pageLeft, tableTop - 6, pageWidth, 20).fill("#f3f3f3");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#1a1a1a");
  doc.text("Item", colItem, tableTop, { width: 260 });
  doc.text("Qtd", colQty, tableTop, { width: 40, align: "right" });
  doc.text("Preço", colUnit, tableTop, { width: 70, align: "right" });
  doc.text("Total", colTotal, tableTop, { width: 80, align: "right" });
  doc.moveTo(pageLeft, tableTop + 14).lineTo(pageRight, tableTop + 14).strokeColor("#d9d9d9").lineWidth(1).stroke();

  let y = tableTop + 22;
  doc.font("Helvetica").fontSize(9).fillColor("#333");

  for (const item of data.items) {
    const lineTotal = item.unitPrice * item.quantity;
    const label =
      item.kind === "training" ? `${item.name} (Formação)` : item.name;
    const itemHeight = doc.heightOfString(label, { width: 260 });

    if (y + itemHeight > 720) {
      doc.addPage();
      y = 50;
    }

    doc.text(label, colItem, y, { width: 260 });
    doc.text(String(item.quantity), colQty, y, { width: 40, align: "right" });
    doc.text(num(item.unitPrice), colUnit, y, { width: 70, align: "right" });
    doc.text(num(lineTotal), colTotal, y, { width: 80, align: "right" });
    y += Math.max(16, itemHeight + 6);
  }

  doc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor("#ddd").lineWidth(0.5).stroke();
  y += 12;

  const productsSubtotal = data.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0
  );
  let shippingAmount = Number(data.shippingAmount) || 0;
  const totalAmount = Number(data.total) || 0;
  if (shippingAmount <= 0 && totalAmount > productsSubtotal + 0.009) {
    shippingAmount = Math.round((totalAmount - productsSubtotal) * 100) / 100;
  }
  const taxRate = data.taxRate != null && Number(data.taxRate) > 0 ? Number(data.taxRate) : 23;

  const writeTotalRow = (label: string, value: string, bold = false, color = "#333") => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(color);
    doc.text(label, 320, y, { width: 120, align: "right" });
    doc.text(value, colTotal, y, { width: 80, align: "right" });
    y += 16;
  };

  writeTotalRow("Subtotal", num(productsSubtotal));
  writeTotalRow("Envio / Shipping", shippingAmount <= 0 ? "Grátis" : num(shippingAmount));
  y += 4;
  writeTotalRow("Total", num(data.total), true, "#111");
  doc.font("Helvetica").fontSize(8).fillColor("#777");
  doc.text(`IVA ${taxRate}% incluído`, 320, y - 2, { width: 220, align: "right" });

  y += 20;
  doc.font("Helvetica").fontSize(8).fillColor("#777")
    .text(
      "Preços incluem IVA à taxa legal aplicável, salvo indicação em contrário. Bio Sculpture Portugal.",
      50,
      y,
      { width: 495 }
    );

  doc.end();
  return done;
}

export function invoiceFilename(orderId: string, documentType: "invoice" | "proforma" = "invoice"): string {
  const short = orderId.slice(0, 8).toUpperCase();
  return documentType === "proforma"
    ? `encomenda-${short}.pdf`
    : `fatura-${short}.pdf`;
}
