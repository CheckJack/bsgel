"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, Settings } from "lucide-react";
import { useState, useEffect } from "react";

interface ClientHeaderProps {
  onMenuClick?: () => void;
}

export function ClientHeader({ onMenuClick }: ClientHeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 md:px-6">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mr-2"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 ml-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden relative">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-full h-full object-cover"
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
            <div className="text-xs text-gray-500 dark:text-gray-400">Account</div>
          </div>
        </div>

        {/* Settings Link */}
        <a
          href="/dashboard/settings"
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Account settings"
        >
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </a>
      </div>
    </header>
  );
}

