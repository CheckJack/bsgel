export type Platform = "INSTAGRAM" | "FACEBOOK" | "TWITTER" | "LINKEDIN" | "TIKTOK";
export type ContentType = "POST" | "STORY" | "REELS";

export interface PlatformLimits {
  captionMaxLength: number;
  captionMinLength?: number;
  hashtagsMax: number;
  imageMinWidth?: number;
  imageMaxWidth?: number;
  imageMinHeight?: number;
  imageMaxHeight?: number;
  videoMaxSizeMB?: number;
  videoMaxDuration?: number;
  supportsVideo: boolean;
  supportsMultipleImages: boolean;
}

export const PLATFORM_LIMITS: Record<Platform, Record<ContentType, PlatformLimits>> = {
  INSTAGRAM: {
    POST: {
      captionMaxLength: 2200,
      captionMinLength: 0,
      hashtagsMax: 30,
      imageMinWidth: 320,
      imageMaxWidth: 1080,
      imageMinHeight: 320,
      imageMaxHeight: 1350,
      videoMaxSizeMB: 100,
      videoMaxDuration: 60,
      supportsVideo: true,
      supportsMultipleImages: true,
    },
    STORY: {
      captionMaxLength: 0,
      hashtagsMax: 10,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 100,
      videoMaxDuration: 15,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    REELS: {
      captionMaxLength: 2200,
      hashtagsMax: 30,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 100,
      videoMaxDuration: 90,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
  },
  FACEBOOK: {
    POST: {
      captionMaxLength: 63206,
      hashtagsMax: 30,
      imageMinWidth: 600,
      imageMaxWidth: 2048,
      imageMinHeight: 600,
      imageMaxHeight: 2048,
      videoMaxSizeMB: 1024,
      videoMaxDuration: 240,
      supportsVideo: true,
      supportsMultipleImages: true,
    },
    STORY: {
      captionMaxLength: 0,
      hashtagsMax: 10,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 100,
      videoMaxDuration: 20,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    REELS: {
      captionMaxLength: 2200,
      hashtagsMax: 30,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 100,
      videoMaxDuration: 90,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
  },
  TWITTER: {
    POST: {
      captionMaxLength: 280,
      captionMinLength: 0,
      hashtagsMax: 10,
      imageMinWidth: 600,
      imageMaxWidth: 4096,
      imageMinHeight: 600,
      imageMaxHeight: 4096,
      videoMaxSizeMB: 512,
      videoMaxDuration: 140,
      supportsVideo: true,
      supportsMultipleImages: true,
    },
    STORY: {
      captionMaxLength: 0,
      hashtagsMax: 0,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 512,
      videoMaxDuration: 140,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    REELS: {
      captionMaxLength: 280,
      hashtagsMax: 10,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 512,
      videoMaxDuration: 140,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
  },
  LINKEDIN: {
    POST: {
      captionMaxLength: 3000,
      hashtagsMax: 5,
      imageMinWidth: 1200,
      imageMaxWidth: 1200,
      imageMinHeight: 627,
      imageMaxHeight: 627,
      videoMaxSizeMB: 200,
      videoMaxDuration: 600,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    STORY: {
      captionMaxLength: 0,
      hashtagsMax: 0,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 200,
      videoMaxDuration: 20,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    REELS: {
      captionMaxLength: 3000,
      hashtagsMax: 5,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 200,
      videoMaxDuration: 600,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
  },
  TIKTOK: {
    POST: {
      captionMaxLength: 2200,
      hashtagsMax: 100,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 287,
      videoMaxDuration: 600,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    STORY: {
      captionMaxLength: 0,
      hashtagsMax: 0,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 287,
      videoMaxDuration: 15,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
    REELS: {
      captionMaxLength: 2200,
      hashtagsMax: 100,
      imageMinWidth: 1080,
      imageMaxWidth: 1080,
      imageMinHeight: 1920,
      imageMaxHeight: 1920,
      videoMaxSizeMB: 287,
      videoMaxDuration: 600,
      supportsVideo: true,
      supportsMultipleImages: false,
    },
  },
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePost(
  platform: Platform,
  contentType: ContentType,
  caption: string,
  hashtags: string[],
  images: string[],
  videos: string[] = []
): ValidationResult {
  const limits = PLATFORM_LIMITS[platform][contentType];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Caption validation
  if (contentType !== "STORY" && caption.length > limits.captionMaxLength) {
    errors.push(
      `Caption exceeds maximum length of ${limits.captionMaxLength} characters (current: ${caption.length})`
    );
  }

  if (limits.captionMinLength !== undefined && caption.length < limits.captionMinLength) {
    errors.push(
      `Caption must be at least ${limits.captionMinLength} characters (current: ${caption.length})`
    );
  }

  // Hashtag validation
  if (hashtags.length > limits.hashtagsMax) {
    errors.push(
      `Too many hashtags. Maximum is ${limits.hashtagsMax} (current: ${hashtags.length})`
    );
  }

  // Media validation
  const totalMedia = images.length + videos.length;
  if (totalMedia === 0) {
    errors.push("At least one image or video is required");
  }

  if (videos.length > 0 && !limits.supportsVideo) {
    errors.push(`${platform} does not support video for ${contentType}`);
  }

  if (images.length > 1 && !limits.supportsMultipleImages) {
    errors.push(`${platform} does not support multiple images for ${contentType}`);
  }

  if (videos.length > 1) {
    errors.push("Only one video is allowed per post");
  }

  if (images.length > 0 && videos.length > 0) {
    errors.push("Cannot mix images and videos in a single post");
  }

  // Character count warning
  const remainingChars = limits.captionMaxLength - caption.length;
  if (remainingChars < 50 && remainingChars >= 0) {
    warnings.push(`Only ${remainingChars} characters remaining in caption`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getImageDimensions(imageSrc: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export function getVideoMetadata(videoSrc: string): Promise<{ duration: number; size: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        size: 0, // Size would need to be passed separately
      });
    };
    video.onerror = reject;
    video.src = videoSrc;
  });
}

