"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  quantity?: number;
}

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MegaMenu({ isOpen, onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories?limit=20");
      if (res.ok) {
        const data = await res.json();
        // Handle both response formats: { categories: [...] } or [...]
        const categoriesData = Array.isArray(data) ? data : (data.categories || []);
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
        onClick={onClose}
        style={{ top: '73px' }}
      />
      
      {/* Mega Menu */}
      <div
        className="fixed left-0 right-0 bg-white shadow-2xl z-50 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ top: '73px' }}
      >
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="text-center py-12">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No categories available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?categoryId=${category.id}`}
                  onClick={onClose}
                  className="group block p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="relative aspect-video w-full mb-3 overflow-hidden rounded-lg bg-gray-100">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-gray-500 text-sm font-medium">{category.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-brand-champagne transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {category.description}
                    </p>
                  )}
                  {category.quantity !== undefined && category.quantity > 0 && (
                    <p className="text-xs text-gray-500 font-medium">
                      {category.quantity} {category.quantity === 1 ? "product" : "products"}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/products"
                onClick={onClose}
                className="text-sm font-medium text-gray-700 hover:text-brand-champagne transition-colors"
              >
                View All Products
              </Link>
              <Link
                href="/diagnosis"
                onClick={onClose}
                className="text-sm font-medium text-gray-700 hover:text-brand-champagne transition-colors"
              >
                Nail Diagnosis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

