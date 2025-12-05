"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X } from "lucide-react";

interface NailDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipate?: () => void;
}

export function NailDiagnosisModal({ isOpen, onClose, onParticipate }: NailDiagnosisModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation after DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleParticipate = () => {
    // Call the onParticipate callback if provided
    if (onParticipate) {
      onParticipate();
    }
    router.push("/diagnosis");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md h-[600px] rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/310 CLoudcha Creative Image (8).jpg"
            alt="Cloudcha Creative Image"
            fill
            className="object-cover"
            unoptimized
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-brand-white flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-brand-black" />
        </button>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-8 text-brand-white">
          {/* Top Content - Title and Text */}
          <div className="space-y-4 md:space-y-6 pt-8">
            {/* Heading - Jost Medium (500) */}
            <h2 className="text-2xl md:text-3xl font-heading font-medium text-left leading-tight">
              Find out more about
              <br />
              your nail type
            </h2>

            {/* Body Text - Jost Light (300) */}
            <div className="space-y-3 text-left">
              <p className="text-sm md:text-base font-light leading-relaxed">
                Did you know there are several different nail types? Just like your hair and skin, each type has its own characteristics and needs!
              </p>
              <p className="text-sm md:text-base font-light leading-relaxed">
                Understanding your nail type is the first step towards achieving healthier, stronger nails. Our comprehensive diagnostic tool will help you identify your specific nail characteristics and provide personalized recommendations.
              </p>
              <p className="text-sm md:text-base font-light leading-relaxed">
                Let us help you find your nail type with our Diagnostic tool and discover the best care routine tailored just for you!
              </p>
            </div>
          </div>

          {/* Bottom Content - Participate Button */}
          <div className="pb-2">
            <Button
              onClick={handleParticipate}
              className="w-full bg-brand-black hover:bg-gray-800 text-brand-white font-medium py-3 rounded-lg text-base"
            >
              Participate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

