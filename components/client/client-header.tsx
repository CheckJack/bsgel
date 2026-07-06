"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

export function ClientHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="-mt-px flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 md:px-6">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {t("clientPanel.header.myAccount")}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label={t("clientPanel.header.toggleTheme")}
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        <div className="ml-2 flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white shadow-sm dark:border-gray-800">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = session?.user?.email?.charAt(0).toUpperCase() || "U";
                  }
                }}
              />
            ) : (
              session?.user?.email?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t("clientPanel.header.account")}
            </div>
          </div>
        </div>

        <a
          href="/dashboard/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label={t("clientPanel.header.accountSettings")}
        >
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </a>
      </div>
    </header>
  );
}
