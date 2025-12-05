"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ShopMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MegaMenuCard {
  id: string;
  menuType: "SHOP" | "ABOUT";
  position: number;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

interface BrandPageChild {
  name: string;
  href: string;
}

interface BrandPage {
  name: string;
  href: string;
  children?: BrandPageChild[];
}

export function ShopMegaMenu({ isOpen, onClose }: ShopMegaMenuProps) {
  const [cards, setCards] = useState<MegaMenuCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCards();
    }
  }, [isOpen]);

  const fetchCards = async () => {
    try {
      setIsLoadingCards(true);
      const res = await fetch("/api/mega-menu-cards?menuType=SHOP");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (error) {
      console.error("Failed to fetch mega menu cards:", error);
    } finally {
      setIsLoadingCards(false);
    }
  };

  if (!isOpen) return null;

  // Brand pages that exist - these link to the brand-specific pages
  const brandPages: BrandPage[] = [
    { 
      name: "BIO Gel", 
      href: "/bio-gel",
      children: [
        { name: "Treatment Gels", href: "/bio-gel/treatment-gels" },
        { name: "Color Gels", href: "/bio-gel/color-gels" },
        { name: "Top Coats", href: "/bio-gel/top-coats" }
      ]
    },
    { 
      name: "Gemini", 
      href: "/gemini",
      children: [
        { name: "Reds", href: "/gemini/reds" },
        { name: "Pinks", href: "/gemini/pinks" },
        { name: "Nudes / Neutrals / Browns", href: "/gemini/nudes-neutrals-browns" },
        { name: "Oranges & Corals / Yellows", href: "/gemini/oranges-corals-yellows" },
        { name: "Blacks / Dark tones", href: "/gemini/blacks-dark-tones" }
      ]
    },
    { 
      name: "Ethos", 
      href: "/ethos",
      children: [
        { name: "Nail diagnosis", href: "/ethos/nail-diagnosis" }
      ]
    },
    { 
      name: "SPA", 
      href: "/spa",
      children: [
        { name: "End Care", href: "/spa/end-care" },
        { name: "Hand Care", href: "/spa/hand-care" },
        { name: "Foot Care", href: "/spa/foot-care" },
        { name: "Spa Ritual Products", href: "/spa/spa-ritual-products" }
      ]
    },
    { 
      name: "Evo", 
      href: "/evo",
      children: [
        { name: "Treatment Base Gels", href: "/evo/treatment-base-gels" },
        { name: "Colour Gels", href: "/evo/colour-gels" },
        { name: "Top Coats", href: "/evo/top-coats" }
      ]
    },
  ];

  // Split into rows of 3
  const topRow = brandPages.slice(0, 3);
  const bottomRow = brandPages.slice(3);

  // Handle link click - close menu and let Next.js Link handle navigation
  const handleLinkClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent click outside handler from firing
    e.stopPropagation();
    // Close menu immediately, navigation will proceed via Next.js Link
    onClose();
  };

  return (
    <div
      data-mega-menu
      className="absolute top-full left-0 w-full bg-black/80 backdrop-blur-md z-50"
      onMouseLeave={onClose}
    >
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Section - Brand Pages */}
          <div className="col-span-6">
            {/* Top Row: 3 columns */}
            {topRow.length > 0 && (
              <div className="grid grid-cols-3 gap-8 mb-8">
                {topRow.map((brand) => (
                  <div key={brand.href} className="space-y-0">
                    <Link
                      href={brand.href}
                      data-mega-menu-link
                      onClick={handleLinkClick}
                      className="block text-sm font-medium text-brand-sweet-bianca mb-2 uppercase tracking-wide hover:text-white transition-colors cursor-pointer"
                    >
                      {brand.name}
                    </Link>
                    {brand.children && brand.children.length > 0 && (
                      <div className="space-y-1">
                        {brand.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            data-mega-menu-link
                            onClick={handleLinkClick}
                            className="block text-sm font-normal text-white hover:text-brand-sweet-bianca transition-colors cursor-pointer"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* Fill empty slots if needed */}
                {Array.from({ length: 3 - topRow.length }).map((_, idx) => (
                  <div key={`empty-top-${idx}`}></div>
                ))}
              </div>
            )}

            {/* Bottom Row: 3 columns */}
            {bottomRow.length > 0 && (
              <div className="grid grid-cols-3 gap-8">
                {bottomRow.map((brand) => (
                  <div key={brand.href} className="space-y-0">
                    <Link
                      href={brand.href}
                      data-mega-menu-link
                      onClick={handleLinkClick}
                      className="block text-sm font-medium text-brand-sweet-bianca mb-2 uppercase tracking-wide hover:text-white transition-colors cursor-pointer"
                    >
                      {brand.name}
                    </Link>
                    {brand.children && brand.children.length > 0 && (
                      <div className="space-y-1">
                        {brand.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            data-mega-menu-link
                            onClick={handleLinkClick}
                            className="block text-sm font-normal text-white hover:text-brand-sweet-bianca transition-colors cursor-pointer"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* Fill empty slots if needed */}
                {Array.from({ length: 3 - bottomRow.length }).map((_, idx) => (
                  <div key={`empty-bottom-${idx}`}></div>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - Product Images Side by Side */}
          <div className="col-span-6 grid grid-cols-2 gap-4">
            {/* Image Panel 1 */}
            {isLoadingCards ? (
              <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gray-800 animate-pulse"></div>
            ) : (() => {
              const card1 = cards.find((c) => c.position === 1);
              if (card1 && card1.isActive) {
                return (
                  <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={card1.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    </div>
                    <div className="absolute inset-0 flex items-end pb-4 px-4">
                      <Link
                        href={card1.linkUrl}
                        data-mega-menu-link
                        onClick={handleLinkClick}
                        className="w-full bg-black hover:bg-gray-800 text-white py-3.5 px-4 rounded-md transition-all duration-200 font-medium text-sm text-center"
                      >
                        Discover
                      </Link>
                    </div>
                  </div>
                );
              }
              // Fallback to default
              return (
                <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src="/306_Sunset_Red_Hands.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized
                    />
                  </div>
                  <div className="absolute inset-0 flex items-end pb-4 px-4">
                    <Link
                      href="/products"
                      data-mega-menu-link
                      onClick={handleLinkClick}
                      className="w-full bg-black hover:bg-gray-800 text-white py-3.5 px-4 rounded-md transition-all duration-200 font-medium text-sm text-center"
                    >
                      Discover
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Image Panel 2 */}
            {isLoadingCards ? (
              <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gray-800 animate-pulse"></div>
            ) : (() => {
              const card2 = cards.find((c) => c.position === 2);
              if (card2 && card2.isActive) {
                return (
                  <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={card2.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    </div>
                    <div className="absolute inset-0 flex items-end pb-4 px-4">
                      <Link
                        href={card2.linkUrl}
                        data-mega-menu-link
                        onClick={handleLinkClick}
                        className="w-full bg-black hover:bg-gray-800 text-white py-3.5 px-4 rounded-md transition-all duration-200 font-medium text-sm text-center"
                      >
                        Discover
                      </Link>
                    </div>
                  </div>
                );
              }
              // Fallback to default
              return (
                <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src="/DSC_8219-v3.webp"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized
                    />
                  </div>
                  <div className="absolute inset-0 flex items-end pb-4 px-4">
                    <Link
                      href="/products"
                      data-mega-menu-link
                      onClick={handleLinkClick}
                      className="w-full bg-black hover:bg-gray-800 text-white py-3.5 px-4 rounded-md transition-all duration-200 font-medium text-sm text-center"
                    >
                      Discover
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

