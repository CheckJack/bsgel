"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
          <p className="text-gray-600 mb-8">{error.message || "An unexpected error occurred"}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

