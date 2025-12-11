"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  MessageCircle,
  BookOpen,
  Ticket,
  BarChart3,
  Share2,
  Bell,
  FileText,
  Shield,
  Award,
  MapPin,
  Images,
  Grid3x3,
  Tags,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickMenuItem {
  title: string;
  href: string;
  icon: any;
}

const quickMenuItems: QuickMenuItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Categories", href: "/admin/categories", icon: FolderTree },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Messages", href: "/admin/messages", icon: MessageCircle },
  { title: "Blogs", href: "/admin/blogs", icon: BookOpen },
  { title: "Coupons", href: "/admin/coupons", icon: Ticket },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Social Media", href: "/admin/social-media", icon: Share2 },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Pages", href: "/admin/pages", icon: FileText },
  { title: "Roles", href: "/admin/roles", icon: Shield },
  { title: "Certifications", href: "/admin/certifications", icon: Award },
  { title: "Salons", href: "/admin/salons", icon: MapPin },
  { title: "Gallery", href: "/admin/gallery", icon: Images },
  { title: "Attributes", href: "/admin/attributes", icon: Tags },
  { title: "Mega Menu Cards", href: "/admin/mega-menu-cards", icon: Grid3x3 },
];

export function AdminQuickMenu() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close panel when navigating to admin pages
  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setIsOpen(false);
    }
  }, [pathname]);

  // Only show if user is admin and not on admin pages
  if (!session || session.user.role !== "ADMIN" || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-[9999] bg-blue-600 hover:bg-blue-700 text-white rounded-l-lg shadow-lg transition-all duration-300",
          "flex items-center justify-center p-3 group hidden md:flex"
        )}
        aria-label="Admin Quick Menu"
      >
        <LayoutDashboard className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-[9999] transition-transform duration-300 ease-in-out overflow-hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-600">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <span className="text-sm font-bold text-white">BS</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Admin Panel
              </div>
              <div className="text-xs text-blue-100">
                Quick Access
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {quickMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

