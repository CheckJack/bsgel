"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  FileDown,
  Settings,
  Users,
  MessageCircle,
  Bell,
  Award,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export type ClientNavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  external?: boolean;
  children?: ClientNavItem[];
};

export type ClientNavSection = {
  title: string;
  items: ClientNavItem[];
};

export function useClientNavSections() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [isLoadingFeatureSettings, setIsLoadingFeatureSettings] = useState(true);
  const [featureSettings, setFeatureSettings] = useState<{
    rewardsEnabled: boolean;
    affiliateEnabled: boolean;
  } | null>(null);

  const navSections: ClientNavSection[] = [
    {
      title: t("clientPanel.sidebar.account"),
      items: [
        {
          title: t("clientPanel.sidebar.orderHistory"),
          href: "/dashboard/orders",
          icon: ShoppingBag,
        },
        {
          title: t("clientPanel.sidebar.myCoupons"),
          href: "/dashboard/coupons",
          icon: Tag,
        },
        {
          title: t("clientPanel.sidebar.messages"),
          href: "/dashboard/messages",
          icon: MessageCircle,
        },
        {
          title: t("clientPanel.sidebar.notifications"),
          href: "/dashboard/notifications",
          icon: Bell,
        },
        {
          title: t("clientPanel.sidebar.resources"),
          href: "/dashboard/resources",
          icon: FileDown,
        },
        {
          title: t("clientPanel.sidebar.rewards"),
          href: "/dashboard/rewards",
          icon: Award,
        },
        {
          title: t("clientPanel.sidebar.affiliateProgram"),
          icon: Users,
          children: [
            {
              title: t("clientPanel.sidebar.overview"),
              href: "/dashboard/affiliate",
              icon: Users,
            },
            {
              title: t("clientPanel.sidebar.myReferrals"),
              href: "/dashboard/affiliates/referrals",
              icon: Users,
            },
            {
              title: t("clientPanel.sidebar.analytics"),
              href: "/dashboard/affiliate/analytics",
              icon: Users,
            },
          ],
        },
        {
          title: t("clientPanel.sidebar.settings"),
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchFeatureSettings = async () => {
      try {
        setIsLoadingFeatureSettings(true);
        const res = await fetch("/api/admin/feature-settings", {
          next: { revalidate: 30 },
        });
        if (res.ok) {
          const data = await res.json();
          setFeatureSettings({
            rewardsEnabled: data.rewardsEnabled ?? true,
            affiliateEnabled: data.affiliateEnabled ?? true,
          });
        } else {
          setFeatureSettings({ rewardsEnabled: false, affiliateEnabled: false });
        }
      } catch {
        setFeatureSettings({ rewardsEnabled: false, affiliateEnabled: false });
      } finally {
        setIsLoadingFeatureSettings(false);
      }
    };

    if (session) {
      void fetchFeatureSettings();
    } else {
      setIsLoadingFeatureSettings(false);
    }
  }, [session]);

  const certification = session?.user?.certification as string | undefined;
  const hasConfirmedCertification =
    certification === "INITIATION" || certification === "PROFESSIONAL";

  const sections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.href === "/dashboard/rewards" || item.title === t("clientPanel.sidebar.rewards")) {
          if (!featureSettings) return false;
          return featureSettings.rewardsEnabled;
        }

        if (item.href === "/dashboard/coupons" || item.title === t("clientPanel.sidebar.myCoupons")) {
          if (!featureSettings) return false;
          return featureSettings.rewardsEnabled;
        }

        if (
          item.title === t("clientPanel.sidebar.affiliateProgram") ||
          item.href === "/dashboard/affiliate" ||
          (item.children &&
            item.children.some(
              (child) =>
                child.href?.startsWith("/dashboard/affiliate") ||
                child.href?.startsWith("/dashboard/affiliates")
            ))
        ) {
          if (!featureSettings) return false;
          return featureSettings.affiliateEnabled;
        }

        if (
          item.href === "/dashboard/orders" ||
          item.href === "/dashboard/messages" ||
          item.href === "/dashboard/settings" ||
          item.href === "/dashboard/notifications"
        ) {
          return true;
        }

        if (item.href === "/dashboard/resources") {
          return hasConfirmedCertification;
        }

        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return { sections, isLoadingFeatureSettings };
}
