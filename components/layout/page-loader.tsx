"use client";

import { useEffect, useState, useRef } from "react";

interface Product {
  id: string;
  name: string;
  image: string | null;
  images: string[];
}

interface FallingItem {
  id: string;
  image: string | null;
  left: number;
  delay: number;
  duration: number;
}

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [imagesReady, setImagesReady] = useState(false);
  const itemsCreated = useRef(false);

  // Fetch products and preload images BEFORE starting animation
  useEffect(() => {
    if (itemsCreated.current) return;
    itemsCreated.current = true;

    // Create items with varied positions
    const createItems = (images: string[] = []) => {
      return Array.from({ length: 40 }, (_, index) => {
        // Better distribution of positions across the screen
        const positionVariations = [
          Math.random() * 20,           // Left side (0-20%)
          20 + Math.random() * 20,      // Left-center (20-40%)
          40 + Math.random() * 20,      // Center (40-60%)
          60 + Math.random() * 20,      // Right-center (60-80%)
          80 + Math.random() * 20,      // Right side (80-100%)
        ];
        const left = positionVariations[index % positionVariations.length] + (Math.random() * 5 - 2.5);
        
        return {
          id: `falling-${index}`,
          image: images.length > 0 ? images[index % images.length] : null,
          left: Math.max(0, Math.min(100, left)), // Clamp between 0-100%
          delay: index * 0.12, // Stagger delays for continuous flow
          duration: 4 + Math.random() * 2, // 4-6s duration - longer to appreciate
        };
      });
    };

    // Fetch products and preload ALL images before starting
    fetch("/api/products", { 
      cache: 'no-store',
    })
      .then(response => {
        if (!response.ok) {
          console.error('Failed to fetch products:', response.status);
          throw new Error('Failed to fetch');
        }
        return response.json();
      })
      .then(async (products: Product[]) => {
        console.log('Products fetched:', products.length);
        // Collect all images quickly
        const images: string[] = [];
        products.forEach((product) => {
          if (product.image) images.push(product.image);
          if (product.images?.length) images.push(...product.images);
        });
        
        const uniqueImages = Array.from(new Set(images)).filter(img => img && img.trim() !== '');
        console.log('Unique images found:', uniqueImages.length);
        
        if (uniqueImages.length === 0) {
          console.warn('No images found in products');
          setImagesReady(true);
          return;
        }

        // Preload ALL images before starting animation
        console.log('Preloading images...');
        const imagePromises = uniqueImages.map((imageUrl) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
              console.warn('Image failed to preload:', imageUrl);
              resolve(); // Continue even if some images fail
            };
            img.src = imageUrl;
          });
        });

        // Wait for all images to load
        await Promise.all(imagePromises);
        console.log('All images preloaded!');

        // Now create items with loaded images
        const newItems = createItems(uniqueImages);
        setFallingItems(newItems);
        
        // Start animation immediately - images are preloaded and ready
        setImagesReady(true);
      })
      .catch(error => {
        console.error("Failed to fetch products:", error);
        setImagesReady(true); // Start anyway
      });
  }, []);

  useEffect(() => {
    // Only start progress animation AFTER images are ready and items are set
    if (!imagesReady || fallingItems.length === 0) return;

    // Calculate total animation time based on falling items
    const lastItem = fallingItems[fallingItems.length - 1];
    const totalAnimationTime = (lastItem.delay + lastItem.duration) * 1000; // Convert to ms
    // Add a bit more time so people can appreciate the last products falling
    const extendedTime = totalAnimationTime + 500; // Add 500ms buffer
    
    const startTime = Date.now();
    
    let animationFrameId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(1, elapsed / extendedTime);
      
      // Smooth easing function (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3);
      const newProgress = Math.round(easedProgress * 100);
      
      setProgress(newProgress);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Ensure progress reaches 100%
        setProgress(100);
        // Wait a moment for people to see 100%, then fade out
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setIsLoading(false);
          }, 500); // Smooth fade out
        }, 300);
      }
    };

    // Start animation synchronized with falling products
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [imagesReady, fallingItems]);

  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-700 ease-out overflow-hidden ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Falling product images */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fallingItems.map((item) => (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.left}%`,
              top: '-300px', // Start completely outside viewport
              animation: imagesReady && item.image ? `fall ${item.duration}s cubic-bezier(0.4, 0, 0.2, 1) infinite` : 'none',
              animationDelay: `${item.delay}s`,
              willChange: 'transform, opacity',
            }}
          >
            <div className="relative">
              {item.image && (
                <img
                  src={item.image}
                  alt="Product"
                  className="max-w-56 max-h-56 md:max-w-64 md:max-h-64 w-auto h-auto object-contain drop-shadow-2xl"
                  loading="eager"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Percentage counter and content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        <div className="text-6xl md:text-7xl font-light text-brand-champagne tracking-wider tabular-nums transition-all duration-150 ease-out">
          {progress}%
        </div>
      </div>
    </div>
  );
}

