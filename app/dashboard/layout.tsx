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
        router.push("/dashboard/orders");
        return;
      }

      const restrictedRoutes = ["/dashboard/resources"];
      const isRestrictedRoute = restrictedRoutes.some((route) => pathname?.startsWith(route));

      if (isPendingCertification && isRestrictedRoute) {
        router.push("/dashboard/orders");
      }
    }
  }, [session, status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100dvh-var(--site-header-height,113px))] items-center justify-center bg-brand-white">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-champagne" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--site-header-height,113px))] flex-col bg-brand-white">
      <main className="flex flex-1 flex-col bg-brand-white">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 font-header sm:px-6 sm:py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
