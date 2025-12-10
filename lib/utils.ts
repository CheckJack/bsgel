import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(numPrice)
}

/**
 * Compresses and resizes an image file to a small size suitable for notifications
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 200)
 * @param maxHeight - Maximum height in pixels (default: 200)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @returns Promise that resolves to base64 string of compressed image
 */
export function compressImage(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

// Re-export toast function from toast component
export { toast } from "@/components/ui/toast"

/**
 * Standardized error handling for API calls
 * Provides user-friendly error messages with context
 */
export function handleApiError(error: any, context: string): void {
  // Dynamic import to avoid circular dependencies
  const toastFn = require("@/components/ui/toast").toast;
  
  // Network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toastFn(`Network error: Unable to ${context}. Please check your internet connection and try again.`, "error");
    return;
  }
  
  // HTTP status code errors (from fetch response)
  if (error?.response) {
    const status = error.response.status;
    const errorData = error.error || {};
    
    switch (status) {
      case 401:
        toastFn("Your session has expired. Please log in again.", "error");
        return;
      case 403:
        toastFn("You don't have permission to perform this action.", "error");
        return;
      case 404:
        toastFn(`The requested resource was not found. Unable to ${context}.`, "error");
        return;
      case 422:
        const message = errorData.error || `Validation error: Unable to ${context}.`;
        toastFn(message, "error");
        return;
      case 429:
        toastFn("Too many requests. Please wait a moment and try again.", "warning");
        return;
      case 500:
      case 502:
      case 503:
        toastFn(`Server error: Unable to ${context}. Please try again later.`, "error");
        return;
      default:
        const errorMsg = errorData.error || `Failed to ${context}.`;
        toastFn(errorMsg, "error");
        return;
    }
  }
  
  // Error with message
  if (error?.message) {
    toastFn(`Failed to ${context}: ${error.message}`, "error");
    return;
  }
  
  // Generic fallback
  toastFn(`Failed to ${context}. Please try again.`, "error");
}

/**
 * Shows a loading toast that can be manually closed
 * Returns the toast ID for later closing (currently not used but available for future)
 */
export function showLoadingToast(message: string = "Processing..."): string {
  const toastFn = require("@/components/ui/toast").toast;
  return toastFn(message, "info", 0); // 0 = don't auto-close
}

/**
 * Closes a loading toast by ID (if needed in future)
 * Currently toasts auto-close, but this is for future extensibility
 */
export function closeLoadingToast(toastId: string): void {
  // Future implementation if needed
}

