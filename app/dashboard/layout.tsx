"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientSidebar } from "@/components/client/client-sidebar";
import { ClientHeader } from "@/components/client/client-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      
      // Routes that require confirmed certification
      const restrictedRoutes = [
        "/dashboard/resources",
        "/dashboard/affiliate",
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
    <div className="fixed inset-0 flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 shadow-sm">
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <ClientHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

