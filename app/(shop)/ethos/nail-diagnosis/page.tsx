"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EthosNailDiagnosisPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main diagnosis page
    router.push("/diagnosis");
  }, [router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to Nail Diagnosis...</p>
    </div>
  );
}

