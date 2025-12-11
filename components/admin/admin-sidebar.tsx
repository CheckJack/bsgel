"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart,
  Home,
  LogOut,
  X,
  ChevronDown,
  Tags,
  Users,
  Shield,
  Images,
  BarChart3,
  FileText,
  Store,
  TrendingUp,
  MapPin,
  MessageCircle,
  Share2,
  BookOpen,
  Ticket,
  Bell,
  Award,
  Grid3x3,
  Coins,
  Gift,
  Settings as SettingsIcon,
  ClipboardList,
  Star
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export function AdminSidebar({ isMobileOpen, onMobileClose, collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const navSections: NavSection[] = [
    {
      title: t("sidebar.mainHome"),
      items: [
        {
          title: t("sidebar.dashboard"),
          href: "/admin",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      title: t("sidebar.allPages"),
      items: [
        {
          title: "Activity Logs",
          href: "/admin/logs",
          icon: ClipboardList,
          badge: null,
        },
        {
          title: t("sidebar.ecommerce"),
          icon: Store,
          badge: null,
          children: [
            {
              title: t("sidebar.products"),
              href: "/admin/products",
              icon: Package,
              badge: null,
            },
            {
              title: t("sidebar.categories"),
              href: "/admin/categories",
              icon: FolderTree,
              badge: null,
            },
            {
              title: t("sidebar.attributes"),
              href: "/admin/attributes",
              icon: Tags,
              badge: null,
            },
            {
              title: t("sidebar.orders"),
              href: "/admin/orders",
              icon: ShoppingCart,
              badge: null,
            },
            {
              title: "Product Reviews",
              href: "/admin/reviews",
              icon: Star,
              badge: null,
            },
          ],
        },
        {
          title: t("sidebar.messages"),
          href: "/admin/messages",
          icon: MessageCircle,
          badge: null,
        },
        {
          title: t("marketing.title"),
          icon: TrendingUp,
          badge: null,
          children: [
            {
              title: t("sidebar.blogs"),
              href: "/admin/blogs",
              icon: BookOpen,
              badge: null,
            },
            {
              title: t("sidebar.coupons"),
              href: "/admin/coupons",
              icon: Ticket,
              badge: null,
            },
            {
              title: t("sidebar.analytics"),
              href: "/admin/analytics",
              icon: BarChart3,
              badge: null,
            },
            {
              title: t("sidebar.socialMedia"),
              href: "/admin/social-media",
              icon: Share2,
              badge: null,
            },
            {
              title: t("sidebar.notifications"),
              href: "/admin/notifications",
              icon: Bell,
              badge: null,
            },
            {
              title: t("sidebar.megaMenuCards"),
              href: "/admin/mega-menu-cards",
              icon: Grid3x3,
              badge: null,
            },
          ],
        },
        {
          title: "Affiliates & Rewards",
          icon: Gift,
          badge: null,
          children: [
            {
              title: "Affiliates",
              href: "/admin/affiliates",
              icon: Users,
              badge: null,
            },
            {
              title: "Points Configuration",
              href: "/admin/points-config",
              icon: SettingsIcon,
              badge: null,
            },
            {
              title: "Rewards Catalog",
              href: "/admin/rewards",
              icon: Gift,
              badge: null,
            },
            {
              title: "Points Transactions",
              href: "/admin/points-transactions",
              icon: Coins,
              badge: null,
            },
            {
              title: "Affiliate Tiers",
              href: "/admin/affiliate-tiers",
              icon: Award,
              badge: null,
            },
          ],
        },
        {
          title: t("sidebar.pages"),
          href: "/admin/pages",
          icon: FileText,
          badge: null,
        },
        {
          title: t("sidebar.users"),
          icon: Users,
          badge: null,
          children: [
            {
              title: t("sidebar.users"),
              href: "/admin/users",
              icon: Users,
              badge: null,
            },
            {
              title: t("sidebar.customers"),
              href: "/admin/customers",
              icon: ShoppingCart,
              badge: null,
            },
            {
              title: t("sidebar.roles"),
              href: "/admin/roles",
              icon: Shield,
              badge: null,
            },
            {
              title: t("sidebar.certifications"),
              href: "/admin/certifications",
              icon: Award,
              badge: null,
            },
            {
              title: t("sidebar.salons"),
              href: "/admin/salons",
              icon: MapPin,
              badge: null,
            },
            {
              title: t("sidebar.gallery"),
              href: "/admin/gallery",
              icon: Images,
              badge: null,
            },
          ],
        },
      ],
    },
    {
      title: t("settings.title"),
      items: [
        {
          title: t("settings.viewShop"),
          href: "/",
          icon: Home,
          badge: null,
          external: true,
        },
      ],
    },
  ];

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
    }
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  // Automatically open dropdown for the active section when navigating
  useEffect(() => {
    // Find which dropdown (if any) contains the active page
    let activeDropdownTitle: string | null = null;
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && isItemActive(item)) {
          activeDropdownTitle = item.title;
        }
      });
    });

    // If we found an active dropdown, ensure it's open (and close others)
    // If no active dropdown, don't change the open dropdowns state
    if (activeDropdownTitle) {
      setOpenDropdowns((prev) => {
        // Only update if the active dropdown isn't already the only one open
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
        // If clicking the same dropdown, close it
        newSet.delete(title);
      } else {
        // If opening a new dropdown, close all others first (only one open at a time)
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
      "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out",
      "w-64",
      isMobileOpen === false ? "-translate-x-full" : "translate-x-0",
      collapsed && "md:w-0 md:overflow-hidden md:border-r-0"
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
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</div>
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
              <div className={cn(collapsed && "md:hidden")}>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Bio Sculpture</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-4", collapsed && "md:hidden")}>
        {navSections.map((section, sectionIdx) => (
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
                            const isChildActive = pathname === child.href || (child.href !== "/admin" && pathname?.startsWith(child.href + "/"));
                            
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

                const isItemActiveState = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));

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
      <div className={cn("border-t border-gray-200 dark:border-gray-700 p-4", collapsed && "md:hidden")}>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to sign out?")) {
              signOut({ callbackUrl: "/" });
            }
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-red-600 text-white transition-colors hover:bg-red-700"
        >
          <LogOut className="h-5 w-5 text-white" />
          <span>{t("sidebar.logout")}</span>
        </button>
      </div>
    </div>
  );
}
