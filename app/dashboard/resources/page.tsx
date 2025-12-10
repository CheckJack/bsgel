"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { FileDown, FileText, Image as ImageIcon, Video, File, Loader2 } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  type: "pdf" | "image" | "video" | "document";
  url: string;
  size?: number;
  description?: string;
  createdAt: string;
}

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pdf" | "image" | "video" | "document">("all");

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
      
      fetchResources();
    }
  }, [session, status, router]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      // Fetch resources from the gallery API
      // Files uploaded in the admin gallery automatically appear here
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        // Transform gallery items to resources format
        const transformedResources: Resource[] = data
          .filter((item: any) => item.type === "FILE" && item.url) // Only files with URLs
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            type: item.mimeType?.includes("pdf")
              ? "pdf"
              : item.mimeType?.includes("image")
              ? "image"
              : item.mimeType?.includes("video")
              ? "video"
              : "document",
            url: item.url || "",
            size: item.size,
            description: item.description,
            createdAt: item.createdAt,
          }));
        setResources(transformedResources);
      } else {
        const error = await res.json();
        console.error("Failed to fetch resources:", error);
        toast(error.error || "Failed to load resources", "error");
        setResources([]);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast("Failed to load resources. Please try again.", "error");
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "image":
        return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case "video":
        return <Video className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const filteredResources = filter === "all" 
    ? resources 
    : resources.filter((r) => r.type === filter);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Resources</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Download media files, documents, and PDFs
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "pdf", "image", "video", "document"] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "outline"}
            onClick={() => setFilter(filterType)}
            className="capitalize"
          >
            {filterType === "all" ? "All Resources" : filterType.toUpperCase()}
          </Button>
        ))}
      </div>

      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileDown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              No resources available at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {getFileIcon(resource.type)}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(resource.size)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resource.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {resource.description}
                  </p>
                )}
                <a
                  href={resource.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">
                    <FileDown className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

