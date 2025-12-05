"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  Table,
  Code,
  Eye,
  Type,
  Palette,
  Smile,
  ChevronDown,
  Upload,
  X,
  Undo,
  Redo,
} from "lucide-react";

interface ImagePreview {
  url: string;
  file?: File;
}

export default function NewPagePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"detail" | "revision">("detail");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    status: "Published",
    template: "Default",
    seoTitle: "",
    seoDescription: "",
    seoUrl: "",
  });
  const [galleryImages, setGalleryImages] = useState<ImagePreview[]>([]);
  const [showSeoEdit, setShowSeoEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);

  // Mock gallery images for initial display
  useEffect(() => {
    // These would normally come from a database or API
    // For now, using placeholder data
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setGalleryImages((prev) => [...prev, { url, file }]);
      }
    });
  };

  const handleImageRemove = (index: number) => {
    setGalleryImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setGalleryImages((prev) => [...prev, { url, file }]);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setFormData({ ...formData, content });
    // Simple word count
    const words = content.trim().split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleSubmit = async (action: "view" | "publish") => {
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would save to the database
      // For now, just redirect to pages list
      if (action === "publish") {
        // Save page
        router.push("/admin/pages");
      } else {
        // View page (preview)
        // In a real app, this would open a preview window
        router.push("/admin/pages");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock gallery images data for display
  const mockGalleryImages = [
    { url: "https://via.placeholder.com/200x200?text=OAT+LY" },
    { url: "https://via.placeholder.com/200x200?text=Sumptuous" },
    { url: "https://via.placeholder.com/200x200?text=PURE+HARMONY" },
    { url: "https://via.placeholder.com/200x200?text=Mypuppy" },
  ];

  const displayGalleryImages = galleryImages.length > 0 ? galleryImages : mockGalleryImages;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Page</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Page{" "}
          <span className="mx-2">&gt;</span> Edit Page
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab("detail")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "detail"
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => setActiveTab("revision")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "revision"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Revision history
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "detail" && (
                <div className="p-6 space-y-6">
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="name"
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="w-full"
                      />
                      {!formData.name && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="relative group">
                            <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full cursor-help"></div>
                            <div className="absolute right-0 top-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                              <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                Please fill out this field.
                                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-800 dark:bg-gray-700 transform rotate-45"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="description"
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                      className="min-h-[100px] w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === "revision" && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No revision history available.
                </div>
              )}

              {/* Rich Text Editor */}
              {activeTab === "detail" && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    {/* Toolbar Row 1 */}
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      <select className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <option>File</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>Edit</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>Insert</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>View</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>Format</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>Table</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>Tools</option>
                      </select>
                    </div>

                    {/* Toolbar Row 2 */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Undo className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Redo className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <select className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <option>Formats</option>
                      </select>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Bold className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Italic className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <AlignLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <AlignCenter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <AlignRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <AlignJustify className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <ListOrdered className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <LinkIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <ImageIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Film className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Table className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Code className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Type className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Palette className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Smile className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Editor Content Area */}
                  <div className="relative">
                    <textarea
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="Start typing your content here..."
                      className="w-full min-h-[400px] p-4 resize-none focus:outline-none text-sm"
                    />
                  </div>

                  {/* Editor Footer */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>p</span>
                    <span>Words: {wordCount}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Section */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search engine optimize
                </h3>
                <button
                  onClick={() => setShowSeoEdit(!showSeoEdit)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  Edit SEO meta
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showSeoEdit ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showSeoEdit ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <Input
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, seoTitle: e.target.value })
                      }
                      placeholder="Enter SEO title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Description
                    </label>
                    <Textarea
                      value={formData.seoDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seoDescription: e.target.value,
                        })
                      }
                      placeholder="Enter SEO description"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO URL
                    </label>
                    <Input
                      value={formData.seoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, seoUrl: e.target.value })
                      }
                      placeholder="Enter SEO URL"
                    />
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="font-semibold text-base text-gray-900 mb-1">
                    {formData.seoTitle || "Lorem ipsum dolor sit amet"}
                  </div>
                  <div className="text-blue-600 text-sm mb-1">
                    {formData.seoUrl ||
                      "https://themeforest.net/user/themesflat"}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {formData.seoDescription ||
                      "20 Nov 2023"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Publish Card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                onClick={() => handleSubmit("view")}
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                disabled={isLoading}
              >
                View
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit("publish")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Publishing..." : "Publish"}
              </Button>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          {/* Template Card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <select
                  value={formData.template}
                  onChange={(e) =>
                    setFormData({ ...formData, template: e.target.value })
                  }
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                >
                  <option value="Default">Default</option>
                  <option value="Blog">Blog</option>
                  <option value="Landing">Landing</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          {/* Gallery Card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Gallery Images Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {displayGalleryImages.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                  >
                    <Image
                      src={image.url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {galleryImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500 text-center">
                  Drop your images here or select{" "}
                  <span className="text-blue-600 underline">click</span> to
                  browse
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

