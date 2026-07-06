"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const loginUrl = pathname
        ? `/login?callbackUrl=${encodeURIComponent(pathname)}`
        : "/login";
      router.replace(loginUrl);
    } else if (session) {
      if (session.user.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      const certification = session.user?.certification as string | undefined;
      const isPendingCertification = certification === "PROFESSIONAL_NON_CERTIFIED";
      const isProfessional = !!certification;

      if (pathname?.startsWith("/dashboard/salon") && !isProfessional) {
        router.push("/dashboard");
        return;
      }

      const restrictedRoutes = ["/dashboard/resources"];
      const isRestrictedRoute = restrictedRoutes.some((route) => pathname?.startsWith(route));

      if (isPendingCertification && isRestrictedRoute) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black dark:border-white" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
