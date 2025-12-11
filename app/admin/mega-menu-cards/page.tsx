"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Save, X, Loader2, Trash2, ExternalLink, AlertCircle, CheckCircle2, Info, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/toast";

interface MegaMenuCard {
  id: string;
  menuType: "SHOP" | "ABOUT";
  position: number; // 1 or 2
  imageUrl: string;
  linkUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type MenuType = "SHOP" | "ABOUT";

export default function MegaMenuCardsPage() {
  const [cards, setCards] = useState<MegaMenuCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [selectedMenuType, setSelectedMenuType] = useState<MenuType>("SHOP");
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({});
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [isToggling, setIsToggling] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Form state for each card
  const [formData, setFormData] = useState<{
    [key: string]: {
      imageUrl: string;
      linkUrl: string;
      imageFile: File | null;
      previewUrl: string | null;
      mediaType: "IMAGE" | "VIDEO";
    };
  }>({});

  useEffect(() => {
    fetchCards();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(formData).forEach((data) => {
        if (data.previewUrl && data.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(data.previewUrl);
        }
      });
    };
  }, [formData]);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/mega-menu-cards?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
        
        // Initialize form data for all possible card combinations
        const initialFormData: typeof formData = {};
        const menuTypes: MenuType[] = ["SHOP", "ABOUT"];
        const positions = [1, 2];
        
        // Initialize all combinations
        menuTypes.forEach((menuType) => {
          positions.forEach((position) => {
            const key = `${menuType}_${position}`;
            const card = (data.cards || []).find(
              (c: MegaMenuCard) => c.menuType === menuType && c.position === position
            );
            initialFormData[key] = {
              imageUrl: card?.imageUrl || "",
              linkUrl: card?.linkUrl || "",
              imageFile: null,
              previewUrl: null,
              mediaType: card?.mediaType || "IMAGE",
            };
          });
        });
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error("Failed to fetch mega menu cards:", error);
      setError("Failed to load mega menu cards");
    } finally {
      setIsLoading(false);
    }
  };

  const getCard = (menuType: MenuType, position: number): MegaMenuCard | undefined => {
    return cards.find((card) => card.menuType === menuType && card.position === position);
  };

  const validateMedia = (file: File): string | null => {
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return "File must be an image or video";
    }
    
    if (isImage && !allowedImageTypes.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed";
    }
    
    if (isVideo && !allowedVideoTypes.includes(file.type)) {
      return "Only MP4, WebM, OGG, and QuickTime videos are allowed";
    }
    
    const maxSize = isImage ? maxImageSize : maxVideoSize;
    if (file.size > maxSize) {
      return `${isImage ? 'Image' : 'Video'} must be less than ${maxSize / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const handleImageChange = (menuType: MenuType, position: number, file: File | null) => {
    const key = `${menuType}_${position}`;
    
    if (file) {
      const validationError = validateMedia(file);
      if (validationError) {
        setError(validationError);
        toast(validationError, "error");
        return;
      }
      setError(null);
      
      // Determine media type from file
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? "VIDEO" : "IMAGE";
      
      // Clean up previous preview URL if it exists
      const prevPreviewUrl = formData[key]?.previewUrl;
      if (prevPreviewUrl && prevPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreviewUrl);
      }
      
      setFormData((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          imageFile: file,
          previewUrl: file ? URL.createObjectURL(file) : prev[key]?.previewUrl || null,
          mediaType: mediaType,
        },
      }));
    } else {
      // Clean up previous preview URL if it exists
      const prevPreviewUrl = formData[key]?.previewUrl;
      if (prevPreviewUrl && prevPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreviewUrl);
      }
      
      setFormData((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          imageFile: null,
          previewUrl: null,
        },
      }));
    }
  };

  const handleLinkChange = (menuType: MenuType, position: number, linkUrl: string) => {
    const key = `${menuType}_${position}`;
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        linkUrl,
      },
    }));
  };

  const validateLink = (linkUrl: string): string | null => {
    if (!linkUrl.trim()) {
      return "Link URL is required";
    }
    
    // Allow relative paths (starting with /) or absolute URLs
    const isRelative = linkUrl.startsWith('/');
    const isAbsolute = /^https?:\/\//.test(linkUrl);
    
    if (!isRelative && !isAbsolute) {
      return "Link must be a relative path (starting with /) or absolute URL (starting with http:// or https://)";
    }
    
    return null;
  };

  const handleSave = async (menuType: MenuType, position: number) => {
    const key = `${menuType}_${position}`;
    const data = formData[key];
    
    if (!data) {
      const errorMsg = "Form data not found";
      setError(errorMsg);
      toast(errorMsg, "error");
      return;
    }

    const linkValidation = validateLink(data.linkUrl);
    if (linkValidation) {
      setError(linkValidation);
      toast(linkValidation, "error");
      return;
    }

    const existingCard = getCard(menuType, position);
    const existingImageUrl = existingCard?.imageUrl || null;

    // Check if image is required (either new file or existing image)
    if (!data.imageFile && !existingImageUrl) {
      const errorMsg = "Image is required";
      setError(errorMsg);
      toast(errorMsg, "error");
      return;
    }

    try {
      setIsSaving((prev) => ({ ...prev, [key]: true }));
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append("menuType", menuType);
      formDataToSend.append("position", position.toString());
      formDataToSend.append("linkUrl", data.linkUrl.trim());
      formDataToSend.append("isActive", existingCard?.isActive !== false ? "true" : "false");
      
      if (data.imageFile) {
        formDataToSend.append("file", data.imageFile);
        formDataToSend.append("mediaType", data.mediaType || "IMAGE");
      } else if (existingImageUrl) {
        formDataToSend.append("existingImageUrl", existingImageUrl);
        formDataToSend.append("mediaType", data.mediaType || existingCard?.mediaType || "IMAGE");
      }

      const res = await fetch("/api/mega-menu-cards", {
        method: "POST",
        body: formDataToSend,
      });

      if (res.ok) {
        const result = await res.json();
        // Update cards state
        setCards((prev) => {
          const existing = prev.find(
            (c) => c.menuType === menuType && c.position === position
          );
          if (existing) {
            return prev.map((c) =>
              c.id === existing.id ? result.card : c
            );
          }
          return [...prev, result.card];
        });

        // Clean up preview URL
        if (data.previewUrl && data.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(data.previewUrl);
        }

        // Clear preview and file
        setFormData((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            imageFile: null,
            previewUrl: null,
            imageUrl: result.card.imageUrl,
            mediaType: result.card.mediaType || "IMAGE",
          },
        }));

        setEditingCard(null);
        toast("Card saved successfully", "success");
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.error || "Failed to save card";
        const errorDetails = errorData.details ? `: ${errorData.details}` : "";
        const fullError = `${errorMessage}${errorDetails}`;
        setError(fullError);
        toast(fullError, "error");
        console.error("API Error:", errorData);
      }
    } catch (error) {
      const errorMsg = `Failed to save card: ${error instanceof Error ? error.message : String(error)}`;
      console.error("Failed to save card:", error);
      setError(errorMsg);
      toast(errorMsg, "error");
    } finally {
      setIsSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleActive = async (menuType: MenuType, position: number) => {
    const card = getCard(menuType, position);
    if (!card) {
      toast("Card not found. Please save the card first.", "error");
      return;
    }

    const key = `${menuType}_${position}`;
    const newActiveState = !card.isActive;

    try {
      setIsToggling((prev) => ({ ...prev, [key]: true }));
      
      const res = await fetch(`/api/mega-menu-cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      if (res.ok) {
        const result = await res.json();
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? result.card : c))
        );
        toast(
          `Card ${newActiveState ? "activated" : "deactivated"} successfully`,
          "success"
        );
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.error || "Failed to update card status";
        toast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Failed to toggle card status:", error);
      toast("Failed to update card status. Please try again.", "error");
    } finally {
      setIsToggling((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDelete = async (menuType: MenuType, position: number) => {
    const card = getCard(menuType, position);
    if (!card) {
      toast("No card to delete", "warning");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete this card? This action cannot be undone.`
      )
    ) {
      return;
    }

    const key = `${menuType}_${position}`;

    try {
      setIsDeleting((prev) => ({ ...prev, [key]: true }));
      
      const res = await fetch(`/api/mega-menu-cards/${card.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== card.id));
        
        // Clean up preview URL if exists
        const data = formData[key];
        if (data?.previewUrl && data.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(data.previewUrl);
        }
        
        // Reset form data
        setFormData((prev) => ({
          ...prev,
          [key]: {
            imageUrl: "",
            linkUrl: "",
            imageFile: null,
            previewUrl: null,
            mediaType: "IMAGE",
          },
        }));
        
        setEditingCard(null);
        toast("Card deleted successfully", "success");
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.error || "Failed to delete card";
        toast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast("Failed to delete card. Please try again.", "error");
    } finally {
      setIsDeleting((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleTestLink = (linkUrl: string) => {
    if (!linkUrl.trim()) {
      toast("Please enter a link URL first", "warning");
      return;
    }
    
    const validation = validateLink(linkUrl);
    if (validation) {
      toast(validation, "error");
      return;
    }
    
    // Open in new tab
    if (linkUrl.startsWith('/')) {
      window.open(linkUrl, '_blank');
    } else {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const CardEditor = ({ menuType, position }: { menuType: MenuType; position: number }) => {
    const card = getCard(menuType, position);
    const key = `${menuType}_${position}`;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const data = formData[key] || {
      imageUrl: card?.imageUrl || "",
      linkUrl: card?.linkUrl || "",
      imageFile: null,
      previewUrl: null,
      mediaType: card?.mediaType || "IMAGE",
    };

    const isEditing = editingCard === key;
    const displayMedia = data.previewUrl || data.imageUrl;
    const mediaType = data.mediaType || card?.mediaType || "IMAGE";
    const isVideo = mediaType === "VIDEO";
    const savingKey = `${menuType}_${position}`;
    const isSavingCard = isSaving[savingKey] || false;
    const isDeletingCard = isDeleting[savingKey] || false;
    const isTogglingCard = isToggling[savingKey] || false;
    const hasUnsavedChanges = isEditing && (
      data.imageFile !== null ||
      data.linkUrl !== (card?.linkUrl || "") ||
      data.mediaType !== (card?.mediaType || "IMAGE")
    );

    const handleUploadClick = () => {
      // Reset the file input value to ensure onChange fires even if the same file is selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fileInputRef.current?.click();
      setEditingCard(key);
    };

    const handleCancel = () => {
      // Clean up preview URL if it's a blob URL
      if (data.previewUrl && data.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(data.previewUrl);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setEditingCard(null);
      // Reset form data for this card
      if (card) {
        setFormData((prev) => ({
          ...prev,
          [key]: {
            imageUrl: card.imageUrl,
            linkUrl: card.linkUrl,
            imageFile: null,
            previewUrl: null,
            mediaType: card.mediaType || "IMAGE",
          },
        }));
      } else {
        // Reset to empty if no card exists
        setFormData((prev) => ({
          ...prev,
          [key]: {
            imageUrl: "",
            linkUrl: "",
            imageFile: null,
            previewUrl: null,
            mediaType: "IMAGE",
          },
        }));
      }
    };

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {menuType} Menu - Card {position}
            </CardTitle>
            {card && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    card.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {card.isActive ? (
                    <>
                      <Eye className="h-3 w-3 inline mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 inline mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current/Preview Media */}
          {displayMedia ? (
            <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
              {isVideo ? (
                <video
                  src={displayMedia}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={displayMedia}
                  alt={`${menuType} Menu Card ${position}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              {data.previewUrl && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Preview
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {isVideo ? "Video" : "Image"}
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No media</p>
              </div>
            </div>
          )}

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Media (Image or Video)
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleImageChange(menuType, position, file);
                    setEditingCard(key);
                  }}
                  className="hidden"
                  aria-label="Upload media file"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleUploadClick}
                  aria-label="Upload or change media"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {data.imageFile ? "Change Media" : displayMedia ? "Replace Media" : "Upload Media"}
                </Button>
                {displayMedia && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (data.previewUrl && data.previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(data.previewUrl);
                      }
                      handleImageChange(menuType, position, null);
                      setEditingCard(key);
                    }}
                    aria-label="Remove media"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Images: 4:5 aspect ratio (e.g., 800x1000px). Max 5MB. JPEG, PNG, or WebP.<br />
                Videos: Max 50MB. MP4, WebM, OGG, or QuickTime.
              </p>
            </div>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discover Button Link
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="/products or https://example.com"
                  value={data.linkUrl}
                  onChange={(e) => {
                    handleLinkChange(menuType, position, e.target.value);
                    setEditingCard(key);
                  }}
                  className="flex-1"
                  aria-label="Link URL for discover button"
                />
                {data.linkUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestLink(data.linkUrl)}
                    aria-label="Test link in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use relative paths (e.g., /products) or absolute URLs (e.g., https://example.com)
              </p>
            </div>
          </div>

          {/* Active/Inactive Toggle */}
          {card && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Card Status
                </label>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(menuType, position)}
                disabled={isTogglingCard}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  card.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                } ${isTogglingCard ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                aria-label={card.isActive ? "Deactivate card" : "Activate card"}
                aria-pressed={card.isActive}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    card.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isEditing && (
              <>
                <Button
                  onClick={() => handleSave(menuType, position)}
                  disabled={isSavingCard || isDeletingCard || !data.linkUrl || (!data.imageFile && !data.imageUrl)}
                  className="flex-1"
                  aria-label="Save changes"
                >
                  {isSavingCard ? (
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
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSavingCard || isDeletingCard}
                  aria-label="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            {card && !isEditing && (
              <Button
                variant="destructive"
                onClick={() => handleDelete(menuType, position)}
                disabled={isDeletingCard || isSavingCard}
                className="flex-1"
                aria-label="Delete card"
              >
                {isDeletingCard ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Card
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Mega Menu Cards
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage the marketing cards displayed in the Shop and About mega menus
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-2 flex-1">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Menu Type Selector */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700" role="tablist">
        <button
          onClick={() => setSelectedMenuType("SHOP")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedMenuType === "SHOP"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
          role="tab"
          aria-selected={selectedMenuType === "SHOP"}
          aria-controls="shop-menu-cards"
        >
          Shop Menu
        </button>
        <button
          onClick={() => setSelectedMenuType("ABOUT")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedMenuType === "ABOUT"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
          role="tab"
          aria-selected={selectedMenuType === "ABOUT"}
          aria-controls="about-menu-cards"
        >
          About Menu
        </button>
      </div>

      {/* Cards Editor */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        id={selectedMenuType === "SHOP" ? "shop-menu-cards" : "about-menu-cards"}
        role="tabpanel"
        aria-labelledby={`${selectedMenuType.toLowerCase()}-menu-tab`}
      >
        <CardEditor menuType={selectedMenuType} position={1} />
        <CardEditor menuType={selectedMenuType} position={2} />
      </div>
    </div>
  );
}

