"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-gray-600 mb-8">{error.message || "An unexpected error occurred"}</p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Link href="/admin">
          <Button variant="outline">Go to admin</Button>
        </Link>
      </div>
    </div>
  );
}

