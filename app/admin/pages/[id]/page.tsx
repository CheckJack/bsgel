"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  ImagePlus,
  Video,
  Trash2,
} from "lucide-react";

interface ImagePreview {
  url: string;
  file?: File;
  type?: "image" | "video";
}

interface Slide {
  type: "video" | "image";
  src: string;
  overlayImage?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface Category {
  image: string;
  text: string;
  link?: string;
  textPosition?: "center" | "bottom-left";
  textCase?: "uppercase" | "lowercase";
}

interface PageSections {
  heroSlider?: {
    slides: Slide[];
  };
  categoryBanner?: {
    categories: Category[];
  };
  trainingBanner?: {
    image?: string;
    text?: string;
    link?: string;
  };
  reasonsToTrain?: {
    images?: string[];
    text?: string;
  };
  asSeenIn?: {
    images?: string[];
  };
  nailPolishDisplay?: {
    images?: string[];
  };
}

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [activeTab, setActiveTab] = useState<"detail" | "sections" | "revision">("detail");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    status: "DRAFT",
    template: "Default",
    seoTitle: "",
    seoDescription: "",
    seoUrl: "",
  });
  const [sections, setSections] = useState<PageSections>({});
  const [showSeoEdit, setShowSeoEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          description: data.description || "",
          content: data.content || "",
          status: data.status || "DRAFT",
          template: data.template || "Default",
          seoTitle: data.seoTitle || "",
          seoDescription: data.seoDescription || "",
          seoUrl: data.seoUrl || "",
        });
        setSections((data.sections as PageSections) || {});
      } else {
        setError("Failed to load page");
      }
    } catch (error) {
      console.error("Failed to fetch page:", error);
      setError("Failed to load page");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImageUpload = async (sectionKey: string, itemIndex: number | null, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setUploadingSection(sectionKey);

    try {
      // Upload files to gallery API
      const uploadPromises = fileArray.map(async (file) => {
        const formData = new FormData();
        formData.append("action", "upload");
        formData.append("file", file);
        formData.append("folderId", "");

        const res = await fetch("/api/gallery", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return data.url || data.item?.url;
        }
        throw new Error("Upload failed");
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update sections based on section type
      setSections((prev) => {
        const updated = { ...prev };

        if (sectionKey === "heroSlider") {
          if (!updated.heroSlider) updated.heroSlider = { slides: [] };
          const newSlides: Slide[] = uploadedUrls.map((url) => ({
            type: url.includes(".mp4") || url.includes(".webm") ? "video" : "image",
            src: url,
          }));
          updated.heroSlider.slides = [...updated.heroSlider.slides, ...newSlides];
        } else if (sectionKey === "categoryBanner") {
          if (!updated.categoryBanner) updated.categoryBanner = { categories: [] };
          const newCategories: Category[] = uploadedUrls.map((url) => ({
            image: url,
            text: "Category",
            textPosition: "center",
            textCase: "uppercase",
          }));
          updated.categoryBanner.categories = [...updated.categoryBanner.categories, ...newCategories];
        } else if (sectionKey.startsWith("categoryBanner-")) {
          // Update specific category
          const index = parseInt(sectionKey.split("-")[1]);
          if (!updated.categoryBanner) updated.categoryBanner = { categories: [] };
          if (updated.categoryBanner.categories[index]) {
            updated.categoryBanner.categories[index].image = uploadedUrls[0];
          }
        } else if (sectionKey === "trainingBanner") {
          if (!updated.trainingBanner) updated.trainingBanner = {};
          updated.trainingBanner.image = uploadedUrls[0];
        } else if (sectionKey === "reasonsToTrain") {
          if (!updated.reasonsToTrain) updated.reasonsToTrain = { images: [] };
          updated.reasonsToTrain.images = [...(updated.reasonsToTrain.images || []), ...uploadedUrls];
        } else if (sectionKey === "asSeenIn") {
          if (!updated.asSeenIn) updated.asSeenIn = { images: [] };
          updated.asSeenIn.images = [...(updated.asSeenIn.images || []), ...uploadedUrls];
        } else if (sectionKey === "nailPolishDisplay") {
          if (!updated.nailPolishDisplay) updated.nailPolishDisplay = { images: [] };
          updated.nailPolishDisplay.images = [...(updated.nailPolishDisplay.images || []), ...uploadedUrls];
        }

        return updated;
      });
    } catch (error) {
      console.error("Failed to upload images:", error);
      setError("Failed to upload images");
    } finally {
      setUploadingSection(null);
    }
  };

  const handleRemoveMedia = (sectionKey: string, index: number) => {
    setSections((prev) => {
      const updated = { ...prev };

      if (sectionKey === "heroSlider" && updated.heroSlider) {
        updated.heroSlider.slides = updated.heroSlider.slides.filter((_, i) => i !== index);
      } else if (sectionKey === "categoryBanner" && updated.categoryBanner) {
        updated.categoryBanner.categories = updated.categoryBanner.categories.filter((_, i) => i !== index);
      } else if (sectionKey === "reasonsToTrain" && updated.reasonsToTrain) {
        updated.reasonsToTrain.images = updated.reasonsToTrain.images?.filter((_, i) => i !== index) || [];
      } else if (sectionKey === "asSeenIn" && updated.asSeenIn) {
        updated.asSeenIn.images = updated.asSeenIn.images?.filter((_, i) => i !== index) || [];
      } else if (sectionKey === "nailPolishDisplay" && updated.nailPolishDisplay) {
        updated.nailPolishDisplay.images = updated.nailPolishDisplay.images?.filter((_, i) => i !== index) || [];
      }

      return updated;
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setFormData({ ...formData, content });
    const words = content.trim().split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleSubmit = async (action: "view" | "publish") => {
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sections,
        }),
      });

      if (res.ok) {
        if (action === "publish") {
          router.push("/admin/pages");
        } else {
          router.push("/admin/pages");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update page");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionMedia = (
    sectionKey: string,
    sectionName: string,
    media: any[],
    type: "slider" | "gallery" | "single" | "categories" = "gallery"
  ) => {
    return (
      <Card className="bg-white dark:bg-gray-800 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{sectionName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === "slider" && media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {media.map((slide: Slide, index: number) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {slide.type === "video" ? (
                      <video
                        src={slide.src}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={slide.src}
                        alt={`Slide ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                    {slide.overlayImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src={slide.overlayImage}
                          alt="Overlay"
                          width={100}
                          height={100}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveMedia(sectionKey, index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {slide.type === "video" ? <Video className="h-3 w-3 inline mr-1" /> : <ImageIcon className="h-3 w-3 inline mr-1" />}
                    Slide {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === "categories" && media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {media.map((category: Category, index: number) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image
                      src={category.image}
                      alt={category.text}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveMedia(sectionKey, index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-2">
                    <Input
                      value={category.text}
                      onChange={(e) => {
                        setSections((prev) => {
                          const updated = { ...prev };
                          if (updated.categoryBanner?.categories[index]) {
                            updated.categoryBanner.categories[index].text = e.target.value;
                          }
                          return updated;
                        });
                      }}
                      placeholder="Category text"
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === "gallery" && media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {media.map((url: string, index: number) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveMedia(sectionKey, index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {type === "single" && media && (
            <div className="relative group">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={media}
                  alt={sectionName}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => {
                  setSections((prev) => {
                    const updated = { ...prev };
                    if (updated.trainingBanner) {
                      updated.trainingBanner.image = undefined;
                    }
                    return updated;
                  });
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              handleImageUpload(sectionKey, null, files);
            }}
            onDragOver={(e) => e.preventDefault()}
            className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900"
          >
            <input
              ref={(el) => (fileInputRefs.current[sectionKey] = el)}
              type="file"
              accept="image/*,video/*"
              multiple={type !== "single"}
              onChange={(e) => {
                if (e.target.files) {
                  handleImageUpload(sectionKey, null, e.target.files);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {uploadingSection === sectionKey ? (
                "Uploading..."
              ) : (
                <>
                  Drop your {type === "single" ? "image" : "images/videos"} here or{" "}
                  <span className="text-blue-600 dark:text-blue-400 underline">click</span> to browse
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Page</h1>
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
                    onClick={() => setActiveTab("sections")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "sections"
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Sections & Media
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
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
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
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Description
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
                      className="min-h-[100px] w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === "sections" && (
                <div className="p-6 space-y-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Page Sections & Media
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage media for each section of your page. Upload images or videos for sliders, banners, and galleries.
                    </p>
                  </div>

                  {/* Hero Slider Section */}
                  {renderSectionMedia(
                    "heroSlider",
                    "Hero Slider (First Section)",
                    sections.heroSlider?.slides || [],
                    "slider"
                  )}

                  {/* Category Banner Section */}
                  {renderSectionMedia(
                    "categoryBanner",
                    "Category Banner",
                    sections.categoryBanner?.categories || [],
                    "categories"
                  )}

                  {/* Training Banner Section */}
                  {sections.trainingBanner?.image && renderSectionMedia(
                    "trainingBanner",
                    "Training Banner",
                    sections.trainingBanner.image,
                    "single"
                  )}
                  {(!sections.trainingBanner?.image) && (
                    <Card className="bg-white dark:bg-gray-800 mb-6">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">Training Banner</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            handleImageUpload("trainingBanner", null, files);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900"
                        >
                          <input
                            ref={(el) => (fileInputRefs.current["trainingBanner"] = el)}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) {
                                handleImageUpload("trainingBanner", null, e.target.files);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Drop your image here or <span className="text-blue-600 dark:text-blue-400 underline">click</span> to browse
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reasons to Train Section */}
                  {renderSectionMedia(
                    "reasonsToTrain",
                    "Reasons to Train",
                    sections.reasonsToTrain?.images || [],
                    "gallery"
                  )}

                  {/* As Seen In Section */}
                  {renderSectionMedia(
                    "asSeenIn",
                    "As Seen In",
                    sections.asSeenIn?.images || [],
                    "gallery"
                  )}

                  {/* Nail Polish Display Section */}
                  {renderSectionMedia(
                    "nailPolishDisplay",
                    "Nail Polish Display",
                    sections.nailPolishDisplay?.images || [],
                    "gallery"
                  )}
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
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      <select className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <option>File</option>
                      </select>
                      <select className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50">
                        <option>Edit</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="Start typing your content here..."
                      className="w-full min-h-[400px] p-4 resize-none focus:outline-none text-sm"
                    />
                  </div>

                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>p</span>
                    <span>Words: {wordCount}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Section */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">
                    {formData.seoTitle || "Lorem ipsum dolor sit amet"}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-sm mb-1">
                    {formData.seoUrl || "https://themeforest.net/user/themesflat"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {formData.seoDescription || "20 Nov 2023"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                onClick={() => handleSubmit("view")}
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
                {isLoading ? "Updating..." : "Update"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
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
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="PENDING">Pending</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
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
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                >
                  <option value="Default">Default</option>
                  <option value="Blog">Blog</option>
                  <option value="Landing">Landing</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
