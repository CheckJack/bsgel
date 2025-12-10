"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Users, DollarSign, Link as LinkIcon, Copy, Check, Loader2 } from "lucide-react";

interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  affiliateCode: string;
  affiliateLink: string;
  commissionRate: number;
}

export default function AffiliatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      // Check if user has confirmed certification
      const certification = session.user?.certification as string | undefined;
      const isPendingCertification = certification === "PROFESSIONAL_NON_CERTIFIED";
      
      if (isPendingCertification) {
        router.push("/dashboard");
        return;
      }
      
      fetchAffiliateData();
    }
  }, [session, status, router]);

  const fetchAffiliateData = async () => {
    try {
      const res = await fetch("/api/affiliate");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const error = await res.json();
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        toast(error.error || "Failed to load affiliate data", "error");
      }
    } catch (error) {
      console.error("Failed to fetch affiliate data:", error);
      toast("Failed to load affiliate data. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session || !stats) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Affiliate Program</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your referrals and earnings from the affiliate program
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalReferrals}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.activeReferrals} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ${stats.pendingEarnings.toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Affiliate Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.affiliateCode}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => copyToClipboard(stats.affiliateCode)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Commission Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.commissionRate}%</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Per successful referral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Link */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Your Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Share this link:</p>
              <p className="text-sm font-mono break-all">{stats.affiliateLink}</p>
            </div>
            <Button
              onClick={() => copyToClipboard(stats.affiliateLink)}
              className="md:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Share Your Link</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your unique affiliate link with friends, family, or on social media.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">They Make a Purchase</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone uses your link to make a purchase, they become your referral.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">You Earn Commission</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You earn {stats.commissionRate}% commission on all purchases made by your referrals. Earnings are paid monthly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

