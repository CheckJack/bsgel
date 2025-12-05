"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface AboutMegaMenuProps {
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

interface AboutPageChild {
  name: string;
  href: string;
}

interface AboutPage {
  name: string;
  href: string;
  children?: AboutPageChild[];
}

export function AboutMegaMenu({ isOpen, onClose }: AboutMegaMenuProps) {
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
      const res = await fetch("/api/mega-menu-cards?menuType=ABOUT");
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

  // About pages structure
  const aboutPages: AboutPage[] = [
    { 
      name: "Biosculpture", 
      href: "/about/biosculpture",
      children: [
        { name: "Concept", href: "/about/biosculpture/concept" },
        { name: "Sustainability", href: "/about/biosculpture/sustainability" },
        { name: "Awards", href: "/about/biosculpture/awards" }
      ]
    },
    {
      name: "Contact",
      href: "/contact",
      children: [
        { name: "Find Salon", href: "/salons" }
      ]
    },
    {
      name: "Blog",
      href: "/blog"
    }
  ];

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
          {/* Left Section - About Pages */}
          <div className="col-span-6">
            {/* Single Row: 3 columns */}
            <div className="grid grid-cols-3 gap-8">
              {aboutPages.map((page) => (
                <div key={page.href} className="space-y-0">
                  <Link
                    href={page.href}
                    data-mega-menu-link
                    onClick={handleLinkClick}
                    className="block text-sm font-medium text-brand-sweet-bianca mb-2 uppercase tracking-wide hover:text-white transition-colors cursor-pointer"
                  >
                    {page.name}
                  </Link>
                  {page.children && page.children.length > 0 && (
                    <div className="space-y-1">
                      {page.children.map((child) => (
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
            </div>
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
                      href="/about/biosculpture"
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
                      href="/about/biosculpture"
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

