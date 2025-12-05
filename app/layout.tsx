import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ChatWidget } from "@/components/chat/chat-widget";

// BIO Sculpture Brand Typography: Jost (Google Fonts alternative to Futura)
// Futura Md BT (Medium) equivalent: Jost Medium (500)
// Futura Lt BT (Light) equivalent: Jost Light (300)
const jost = Jost({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "Bio Sculpture - Premium Nail Products",
  description: "Shop premium Bio Sculpture nail products and treatments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jost.variable}>
        <Providers>
          <ConditionalNavbar />
          <main className="min-h-screen bg-white">{children}</main>
          <ConditionalFooter />
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}

