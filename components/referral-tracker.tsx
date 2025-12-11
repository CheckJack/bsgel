"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Only process once per page load
    if (hasProcessed) return;

    const refCode = searchParams?.get("ref");
    if (!refCode) {
      setHasProcessed(true);
      return;
    }

    // Validate referral code format (basic validation)
    const trimmedCode = refCode.trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length < 3) {
      console.warn("Invalid referral code format:", refCode);
      setHasProcessed(true);
      return;
    }

    // Note: Self-referral prevention is handled on the backend during registration
    
    const processReferralCode = async () => {
      try {
        // First, validate the affiliate code exists and is active
        const validateRes = await fetch(`/api/affiliate/validate-code?code=${encodeURIComponent(trimmedCode)}`);
        
        if (!validateRes.ok) {
          console.warn("Invalid or inactive affiliate code:", trimmedCode);
          setHasProcessed(true);
          return;
        }

        const validationData = await validateRes.json();
        if (!validationData.valid) {
          console.warn("Affiliate code validation failed:", trimmedCode);
          setHasProcessed(true);
          return;
        }

        // Store in localStorage
        try {
          localStorage.setItem("referralCode", trimmedCode);
        } catch (storageError) {
          console.warn("Failed to store referral code in localStorage:", storageError);
        }
        
        // Store in cookie (30 days expiry)
        try {
          const expiryDate = new Date();
          expiryDate.setTime(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          document.cookie = `referralCode=${trimmedCode}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
        } catch (cookieError) {
          console.warn("Failed to store referral code in cookie:", cookieError);
        }
        
        // Track click (fire and forget - don't block on this)
        fetch("/api/affiliate/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ affiliateCode: trimmedCode }),
        }).catch((error) => {
          // Silently fail - tracking is not critical
          console.debug("Failed to track affiliate click (non-critical):", error);
        });
        
        console.log("Referral code captured and validated:", trimmedCode);
        setHasProcessed(true);
      } catch (error) {
        console.error("Error processing referral code:", error);
        setHasProcessed(true);
      }
    };

    processReferralCode();
  }, [searchParams, hasProcessed]);

  return null; // This component doesn't render anything
}

