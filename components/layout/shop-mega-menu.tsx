"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils";
import { isColourBuilderGelProduct } from "@/lib/colour-builder-hero";

interface ShopMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
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

interface MenuProduct {
  id: string;
  name: string;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images?: string[];
}

export function ShopMegaMenu({ isOpen, onClose, onMouseEnter }: ShopMegaMenuProps) {
  const { t } = useLanguage();
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMenuProducts = async () => {
      try {
        const res = await fetch("/api/products?limit=32&sortBy=newest", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const products = Array.isArray(data?.products) ? data.products : [];

        const preferredSections = ["bases", "builders", "softs", "colours", "evo", "gemini"];
        const selected: MenuProduct[] = [];
        const usedIds = new Set<string>();

        for (const section of preferredSections) {
          const match = products.find(
            (p: MenuProduct & { showcasingSections?: string[] }) =>
              !usedIds.has(p.id) &&
              Array.isArray(p.showcasingSections) &&
              p.showcasingSections.includes(section) &&
              (p.image || (Array.isArray(p.images) && p.images.length > 0))
          );
          if (match) {
            selected.push(match);
            usedIds.add(match.id);
          }
          if (selected.length === 4) break;
        }

        if (selected.length < 4) {
          for (const product of products) {
            if (
              !usedIds.has(product.id) &&
              (product.image || (Array.isArray(product.images) && product.images.length > 0))
            ) {
              selected.push(product);
              usedIds.add(product.id);
            }
            if (selected.length === 4) break;
          }
        }

        setMenuProducts(selected);
      } catch (error) {
        console.error("Failed to fetch menu products:", error);
      }
    };

    fetchMenuProducts();
  }, [isOpen]);

  if (!isOpen) return null;

  // Brand pages that exist - these link to the brand-specific pages
  const brandPages: BrandPage[] = [
    { 
      name: t("nav.shopMenu.bioGel"), 
      href: "/bio-gel",
      children: []
    },
    { 
      name: t("nav.shopMenu.evo"), 
      href: "/evo",
      children: []
    },
    { 
      name: t("nav.shopMenu.colours"), 
      href: "/colours",
      children: []
    },
    { 
      name: t("nav.shopMenu.ethos"), 
      href: "/ethos",
      children: []
    },
    { 
      name: t("nav.shopMenu.spa"), 
      href: "/spa",
      children: []
    },
    { 
      name: t("nav.shopMenu.gemini"), 
      href: "/gemini"
    },
    {
      name: t("nav.shopMenu.bases"),
      href: "/bases",
    },
    {
      name: t("nav.shopMenu.builders"),
      href: "/builders",
    },
    {
      name: t("nav.shopMenu.softs"),
      href: "/softs",
    },
    {
      name: t("nav.shopMenu.extensao"),
      href: "/extensao",
    },
    {
      name: t("nav.shopMenu.eletronicos"),
      href: "/eletronicos",
    },
    {
      name: t("nav.shopMenu.promocoes"),
      href: "/promocoes",
    },
    {
      name: t("nav.shopMenu.solventes"),
      href: "/solventes",
    },
    {
      name: t("nav.shopMenu.nailArt"),
      href: "/nail-art",
    },
    {
      name: t("nav.shopMenu.tips"),
      href: "/tips",
    },
    {
      name: t("nav.shopMenu.utensilios"),
      href: "/utensilios",
    },
    {
      name: t("nav.shopMenu.pinceis"),
      href: "/pinceis",
    },
    {
      name: t("nav.shopMenu.limaBuffs"),
      href: "/lima-buffs",
    },
  ];

  // Render menu in rows of 3 columns, regardless of item count
  const brandRows: BrandPage[][] = [];
  for (let i = 0; i < brandPages.length; i += 3) {
    brandRows.push(brandPages.slice(i, i + 3));
  }

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
      className="absolute top-full left-0 z-[10] w-full border-t border-black/10 bg-brand-white shadow-lg"
      onMouseEnter={onMouseEnter}
      onMouseLeave={(event) => {
        const related = event.relatedTarget as Element | null;
        if (related?.closest("[data-shop-mega-menu-trigger]")) return;
        onClose();
      }}
    >
      <div className="absolute inset-x-0 -top-3 h-3" aria-hidden />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Section - Brand Pages */}
          <div className="col-span-6">
            {brandRows.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className={`grid grid-cols-3 gap-1 ${rowIndex < brandRows.length - 1 ? "mb-3" : ""}`}
              >
                {row.map((brand) => (
                  <div key={brand.href} className="space-y-0">
                    <Link
                      href={brand.href}
                      data-mega-menu-link
                      onClick={handleLinkClick}
                      className="block font-header text-[13px] text-brand-black mb-1 uppercase tracking-[0.14em] hover:text-brand-champagne transition-colors cursor-pointer"
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
                            className="block text-sm font-normal text-brand-black/70 hover:text-brand-champagne transition-colors cursor-pointer"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - row.length) }).map((_, idx) => (
                  <div key={`empty-${rowIndex}-${idx}`}></div>
                ))}
              </div>
            ))}
          </div>

          {/* Right Section - Featured Products */}
          <div className="col-span-6 grid grid-cols-4 gap-2">
            {menuProducts.map((product) => {
              const previewImage = product.image || product.images?.[0] || null;
              const showNewBadge = isColourBuilderGelProduct(product.name);
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  data-mega-menu-link
                  onClick={handleLinkClick}
                  className="group block"
                >
                  <div className="h-full">
                    <div className="relative w-full aspect-square overflow-hidden mb-2 bg-transparent">
                      {showNewBadge && (
                        <span className="absolute left-1 top-1 z-10 rounded bg-pink-900 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                          {t("products.newBadge")}
                        </span>
                      )}
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 1024px) 20vw, 12vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          {t("products.noImage")}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-normal tracking-wide text-brand-black/70 uppercase line-clamp-2 min-h-[2rem] group-hover:text-brand-black transition-colors">
                      {product.name}
                    </p>
                    <p className="text-[11px] font-medium text-brand-champagne mt-1">
                      {product.salePrice ? formatPrice(product.salePrice) : formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

