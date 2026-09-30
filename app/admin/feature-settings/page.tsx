"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Loader2, Save, Award, Users, ShieldAlert, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type FeatureSettingsState = {
  rewardsEnabled: boolean;
  affiliateEnabled: boolean;
  maintenanceMode: boolean;
};

export default function FeatureSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<FeatureSettingsState>({
    rewardsEnabled: true,
    affiliateEnabled: true,
    maintenanceMode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/feature-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          rewardsEnabled: data.rewardsEnabled ?? true,
          affiliateEnabled: data.affiliateEnabled ?? true,
          maintenanceMode: data.maintenanceMode ?? false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast(t("toasts.settingsLoadFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/feature-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({
          rewardsEnabled: data.rewardsEnabled ?? settings.rewardsEnabled,
          affiliateEnabled: data.affiliateEnabled ?? settings.affiliateEnabled,
          maintenanceMode: data.maintenanceMode ?? settings.maintenanceMode,
        });
        toast(t("toasts.settingsSaved"), "success");
      } else {
        const error = await res.json();
        toast(error.error || t("toasts.settingsSaveFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast(t("toasts.settingsSaveFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (feature: keyof FeatureSettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const clearStorefrontCache = async () => {
    try {
      setIsClearingCache(true);
      const res = await fetch("/api/admin/revalidate-cache", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || "Storefront cache cleared", "success");
      } else {
        toast(data.error || "Failed to clear cache", "error");
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast("Failed to clear cache", "error");
    } finally {
      setIsClearingCache(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Feature Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Control site access, rewards, and affiliate visibility
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Maintenance Mode Toggle */}
        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ShieldAlert className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>Maintenance mode</CardTitle>
                  <CardDescription className="mt-1">
                    When enabled, public visitors only see the Coming Soon page. Admins can still
                    log in at /login and use the full website and admin backend.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {settings.maintenanceMode ? "On — site locked for public" : "Off — site open"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {settings.maintenanceMode
                    ? "Customers are redirected to Coming Soon. You keep full access."
                    : "Everyone can browse and shop normally."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFeature("maintenanceMode")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                  settings.maintenanceMode
                    ? "bg-amber-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label="Toggle maintenance mode"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Clear storefront cache */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle>Clear storefront cache</CardTitle>
                  <CardDescription className="mt-1">
                    Force product and listing pages to refresh. Safe — does not delete products or
                    media. Product saves already clear cache automatically; use this if a page still
                    looks stale.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={clearStorefrontCache}
              disabled={isClearingCache}
              className="gap-2"
            >
              {isClearingCache ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Clearing…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Clear cache now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Rewards Program Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle>Rewards Program</CardTitle>
                  <CardDescription className="mt-1">
                    When disabled, the rewards program will be hidden from all customer-facing pages including the dashboard, sidebar navigation, and rewards catalog page.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {settings.rewardsEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {settings.rewardsEnabled
                    ? "Rewards program is visible to customers"
                    : "Rewards program is hidden from customers"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFeature("rewardsEnabled")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.rewardsEnabled
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label="Toggle rewards program"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.rewardsEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Program Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Affiliate Program</CardTitle>
                  <CardDescription className="mt-1">
                    When disabled, the affiliate program will be hidden from all customer-facing pages including the dashboard, sidebar navigation, and affiliate pages.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {settings.affiliateEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {settings.affiliateEnabled
                    ? "Affiliate program is visible to customers"
                    : "Affiliate program is hidden from customers"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleFeature("affiliateEnabled")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.affiliateEnabled
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label="Toggle affiliate program"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.affiliateEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
