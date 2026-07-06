import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { getMetadataForPath } from "@/lib/seo/metadata";
import { Providers } from "@/components/providers";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AdminQuickMenu } from "@/components/admin/admin-quick-menu";
import { ReferralTracker } from "@/components/referral-tracker";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";

// BIO Sculpture Brand Typography: Jost (Google Fonts alternative to Futura)
// Futura Md BT (Medium) equivalent: Jost Medium (500)
// Futura Lt BT (Light) equivalent: Jost Light (300)
const jost = Jost({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jost",
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";
  return getMetadataForPath(pathname);
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ffffff",
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="ios-edge-to-edge">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (typeof window === 'undefined') return;

                function syncIosViewport() {
                  if (!window.matchMedia('(max-width: 1023px)').matches) return;
                  if (window.location.pathname === '/login' || window.location.pathname === '/register') return;
                  var vv = window.visualViewport;
                  var lvhHeight = 0;
                  var probe = document.createElement('div');
                  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;height:100lvh;top:0;left:0;width:0;';
                  document.documentElement.appendChild(probe);
                  lvhHeight = probe.offsetHeight;
                  probe.remove();
                  var h = Math.max(
                    window.innerHeight,
                    document.documentElement.clientHeight,
                    lvhHeight,
                    vv ? vv.height + (vv.offsetTop || 0) : 0
                  );
                  document.documentElement.style.setProperty('--ios-viewport-height', h + 'px');
                  document.documentElement.style.setProperty('--app-height', h + 'px');
                }

                syncIosViewport();
                window.addEventListener('resize', syncIosViewport, { passive: true });
                if (window.visualViewport && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                  window.visualViewport.addEventListener('resize', syncIosViewport, { passive: true });
                  window.visualViewport.addEventListener('scroll', syncIosViewport, { passive: true });
                }

                if (window.location.pathname === '/') {
                  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
                  document.documentElement.style.backgroundColor = '#857D71';
                  document.body.style.backgroundColor = '#857D71';
                  document.documentElement.classList.add('home-entry-loader-scroll-lock');
                  document.documentElement.classList.add('home-entry-loader-active');
                  window.scrollTo(0, 0);
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                }

                if (window.location.pathname === '/salons') {
                  document.documentElement.style.backgroundColor = '#ddd';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${jost.variable} ios-edge-to-edge-body`}>
        <div className="ios-edge-bleed" aria-hidden />
        <Providers>
          <div className="mobile-app-shell">
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            <ConditionalNavbar />
            <div className="app-scroll-root">
              <main className="min-h-screen min-h-[100svh] min-h-[100lvh] bg-white">{children}</main>
              <ConditionalFooter />
            </div>
            <ChatWidget />
            <AdminQuickMenu />
            <CookieConsentBanner />
          </div>
        </Providers>
      </body>
    </html>
  );
}

