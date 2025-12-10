"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag,
  FileDown,
  Settings,
  Users,
  BookOpen,
  MapPin,
  MessageCircle,
  Bell,
  LogOut,
  X,
  ChevronDown,
  Menu,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ClientSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  badge?: any;
  external?: boolean;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        badge: null,
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        title: "Order History",
        href: "/dashboard/orders",
        icon: ShoppingBag,
        badge: null,
      },
      {
        title: "Messages",
        href: "/dashboard/messages",
        icon: MessageCircle,
        badge: null,
      },
      {
        title: "Notifications",
        href: "/dashboard/notifications",
        icon: Bell,
        badge: null,
      },
      {
        title: "My Salon",
        href: "/dashboard/salon",
        icon: MapPin,
        badge: null,
      },
      {
        title: "Resources",
        href: "/dashboard/resources",
        icon: FileDown,
        badge: null,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
  {
    title: "PROGRAMS",
    items: [
      {
        title: "Affiliate Program",
        href: "/dashboard/affiliate",
        icon: Users,
        badge: null,
      },
      {
        title: "Blog",
        href: "/dashboard/blog",
        icon: BookOpen,
        badge: null,
      },
    ],
  },
];

export function ClientSidebar({ isMobileOpen, onMobileClose }: ClientSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  
  // Check if user is pending certification
  const certification = session?.user?.certification as string | undefined;
  const isPendingCertification = certification === "PROFESSIONAL_NON_CERTIFIED";
  const hasConfirmedCertification = certification === "INITIATION" || certification === "PROFESSIONAL";
  
  // Filter nav items based on certification status
  const getFilteredNavSections = () => {
    return navSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Always show: Dashboard, Order History, Messages, My Salon, Settings, Blog
        if (item.href === "/dashboard" || 
            item.href === "/dashboard/orders" || 
            item.href === "/dashboard/messages" ||
            item.href === "/dashboard/salon" ||
            item.href === "/dashboard/settings" || 
            item.href === "/dashboard/blog") {
          return true;
        }
        // Only show restricted items if certification is confirmed
        if (item.href === "/dashboard/resources" || 
            item.href === "/dashboard/affiliate") {
          return hasConfirmedCertification;
        }
        return true;
      })
    })).filter(section => section.items.length > 0);
  };
  
  const filteredNavSections = getFilteredNavSections();

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));
    }
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  // Automatically open dropdown for the active section when navigating
  useEffect(() => {
    let activeDropdownTitle: string | null = null;
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && isItemActive(item)) {
          activeDropdownTitle = item.title;
        }
      });
    });

    if (activeDropdownTitle) {
      setOpenDropdowns((prev) => {
        if (prev.size !== 1 || !prev.has(activeDropdownTitle!)) {
          return new Set([activeDropdownTitle!]);
        }
        return prev;
      });
    }
  }, [pathname]);

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.clear();
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <div className={cn(
      "flex h-full flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
      "md:static md:translate-x-0",
      "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out",
      isMobileOpen === false ? "-translate-x-full" : "translate-x-0"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
        {onMobileClose ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">BS</span>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Bio Sculpture</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">My Account</div>
              </div>
            </div>
            <button
              onClick={onMobileClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">BS</span>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Bio Sculpture</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">My Account</div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden md:block"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {filteredNavSections.map((section, sectionIdx) => (
          <div key={section.title} className={cn("mb-6", sectionIdx === 0 && "mt-2")}>
            {/* Section Header */}
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>

            {/* Section Items */}
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isDropdownOpen = openDropdowns.has(item.title);
                const isActive = isItemActive(item);

                if (hasChildren) {
                  return (
                    <div key={item.title}>
                      <button
                        onClick={() => toggleDropdown(item.title)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                          )} />
                          <span>{item.title}</span>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform",
                          isDropdownOpen && "rotate-180"
                        )} />
                      </button>
                      {isDropdownOpen && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                          {item.children!.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive = pathname === child.href || (child.href !== "/dashboard" && pathname?.startsWith(child.href + "/"));
                            
                            return (
                              <Link
                                key={child.href}
                                href={child.href!}
                                onClick={() => {
                                  if (onMobileClose) onMobileClose();
                                }}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group",
                                  isChildActive
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                                )}
                              >
                                <ChildIcon className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                )} />
                                <span>{child.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isItemActiveState = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href || item.title}
                    href={item.href!}
                    onClick={() => {
                      if (onMobileClose) onMobileClose();
                    }}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                      isItemActiveState
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isItemActiveState ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      )} />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

