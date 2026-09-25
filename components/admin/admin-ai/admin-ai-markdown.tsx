"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function AdminAiMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "admin-ai-markdown prose prose-sm max-w-none dark:prose-invert",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
        "prose-table:text-xs prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1",
        "prose-a:text-[#6b6358] prose-a:underline hover:prose-a:text-[#857D71]",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
