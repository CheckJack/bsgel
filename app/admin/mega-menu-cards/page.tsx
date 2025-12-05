"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Save, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface MegaMenuCard {
  id: string;
  menuType: "SHOP" | "ABOUT";
  position: number; // 1 or 2
  imageUrl: string;
  linkUrl: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for each card
  const [formData, setFormData] = useState<{
    [key: string]: {
      imageUrl: string;
      linkUrl: string;
      imageFile: File | null;
      previewUrl: string | null;
    };
  }>({});

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/mega-menu-cards?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
        
        // Initialize form data
        const initialFormData: typeof formData = {};
        (data.cards || []).forEach((card: MegaMenuCard) => {
          const key = `${card.menuType}_${card.position}`;
          initialFormData[key] = {
            imageUrl: card.imageUrl,
            linkUrl: card.linkUrl,
            imageFile: null,
            previewUrl: null,
          };
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

  const handleImageChange = (menuType: MenuType, position: number, file: File | null) => {
    const key = `${menuType}_${position}`;
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        imageFile: file,
        previewUrl: file ? URL.createObjectURL(file) : prev[key]?.previewUrl || null,
      },
    }));
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

  const handleSave = async (menuType: MenuType, position: number) => {
    const key = `${menuType}_${position}`;
    const data = formData[key];
    
    if (!data) {
      setError("Form data not found");
      return;
    }

    if (!data.linkUrl) {
      setError("Link URL is required");
      return;
    }

    const existingCard = getCard(menuType, position);
    const existingImageUrl = existingCard?.imageUrl || null;

    try {
      setIsSaving(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append("menuType", menuType);
      formDataToSend.append("position", position.toString());
      formDataToSend.append("linkUrl", data.linkUrl);
      formDataToSend.append("isActive", "true");
      
      if (data.imageFile) {
        formDataToSend.append("file", data.imageFile);
      } else if (existingImageUrl) {
        formDataToSend.append("existingImageUrl", existingImageUrl);
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

        // Clear preview and file
        setFormData((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            imageFile: null,
            previewUrl: null,
            imageUrl: result.card.imageUrl,
          },
        }));

        setEditingCard(null);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to save card");
      }
    } catch (error) {
      console.error("Failed to save card:", error);
      setError("Failed to save card");
    } finally {
      setIsSaving(false);
    }
  };

  const CardEditor = ({ menuType, position }: { menuType: MenuType; position: number }) => {
    const card = getCard(menuType, position);
    const key = `${menuType}_${position}`;
    const data = formData[key] || {
      imageUrl: card?.imageUrl || "",
      linkUrl: card?.linkUrl || "",
      imageFile: null,
      previewUrl: null,
    };

    const isEditing = editingCard === key;
    const displayImage = data.previewUrl || data.imageUrl;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">
            {menuType} Menu - Card {position}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current/Preview Image */}
          {displayImage && (
            <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
              <Image
                src={displayImage}
                alt={`${menuType} Menu Card ${position}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleImageChange(menuType, position, file);
                    setEditingCard(key);
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditingCard(key)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {data.imageFile ? "Change Image" : "Upload Image"}
                </Button>
              </label>
            </div>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discover Button Link
            </label>
            <Input
              type="url"
              placeholder="/products or https://example.com"
              value={data.linkUrl}
              onChange={(e) => {
                handleLinkChange(menuType, position, e.target.value);
                setEditingCard(key);
              }}
            />
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleSave(menuType, position)}
                disabled={isSaving || !data.linkUrl}
                className="flex-1"
              >
                {isSaving ? (
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
                onClick={() => {
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
                      },
                    }));
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Menu Type Selector */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSelectedMenuType("SHOP")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedMenuType === "SHOP"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Shop Menu
        </button>
        <button
          onClick={() => setSelectedMenuType("ABOUT")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedMenuType === "ABOUT"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          About Menu
        </button>
      </div>

      {/* Cards Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardEditor menuType={selectedMenuType} position={1} />
        <CardEditor menuType={selectedMenuType} position={2} />
      </div>
    </div>
  );
}

