"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ClientSidebar } from "@/components/client/client-sidebar";
import { ClientHeader } from "@/components/client/client-header";
import { ToastContainer } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(120);

  // Calculate navbar height dynamically
  useEffect(() => {
    const updateNavbarHeight = () => {
      // Find the navbar wrapper element (the sticky container)
      const navbar = document.querySelector('nav')?.closest('div[class*="sticky"]') as HTMLElement;
      if (navbar) {
        const height = navbar.offsetHeight;
        setNavbarHeight(height);
      } else {
        // Fallback: try to find any element with sticky and z-[100]
        const fallbackNavbar = Array.from(document.querySelectorAll('div')).find(
          el => el.classList.contains('sticky') && 
                (el.style.zIndex === '100' || el.className.includes('z-[100]'))
        ) as HTMLElement;
        if (fallbackNavbar) {
          setNavbarHeight(fallbackNavbar.offsetHeight);
        }
      }
    };

    // Initial calculation with multiple attempts
    updateNavbarHeight();
    const timeout1 = setTimeout(updateNavbarHeight, 50);
    const timeout2 = setTimeout(updateNavbarHeight, 200);
    
    // Update on resize
    window.addEventListener("resize", updateNavbarHeight);
    
    // Use MutationObserver to watch for navbar changes
    const observer = new MutationObserver(updateNavbarHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      window.removeEventListener("resize", updateNavbarHeight);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      // Redirect admin users to admin panel
      if (session.user.role === "ADMIN") {
        router.push("/admin");
        return;
      }
      
      // Check if user is pending certification and trying to access restricted pages
      const certification = session.user?.certification as string | undefined;
      const isPendingCertification = certification === "PROFESSIONAL_NON_CERTIFIED";
      const isProfessional = !!certification;
      
      // Salon page is only for professionals (users with certification)
      if (pathname?.startsWith("/dashboard/salon") && !isProfessional) {
        router.push("/dashboard");
        return;
      }
      
      // Routes that require confirmed certification (only resources now)
      const restrictedRoutes = [
        "/dashboard/resources",
      ];
      
      const isRestrictedRoute = restrictedRoutes.some(route => pathname?.startsWith(route));
      
      if (isPendingCertification && isRestrictedRoute) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Desktop Sidebar */}
      <aside 
        className="hidden md:block md:fixed md:left-0 md:bottom-0 md:w-64 md:flex-shrink-0 shadow-sm z-30 overflow-y-auto"
        style={{ top: `${navbarHeight}px` }}
      >
        <ClientSidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside className="md:hidden">
        <ClientSidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
      </aside>

      {/* Main Content - Account for navbar height */}
      <div className="md:ml-64 flex flex-col flex-1">
        {/* Top Header - Sticky below navbar, no gap */}
        <div 
          className="flex-shrink-0 sticky z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          style={{ top: `${navbarHeight}px` }}
        >
          <ClientHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        </div>

        {/* Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

