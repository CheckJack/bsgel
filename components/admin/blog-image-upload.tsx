"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ImagePreview {
  url: string;
  file?: File;
}

interface BlogImageUploadProps {
  title: string;
  description: string;
  image: ImagePreview | null;
  onImageChange: (image: ImagePreview | null) => void;
  inputId: string;
}

export async function imagePreviewToDataUrl(
  image: ImagePreview | null
): Promise<string | null> {
  if (!image) {
    return null;
  }

  if (image.file) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read image file"));
      };
      reader.readAsDataURL(image.file!);
    });
  }

  return image.url;
}

export function BlogImageUpload({
  title,
  description,
  image,
  onImageChange,
  inputId,
}: BlogImageUploadProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageChange({ url: URL.createObjectURL(file), file });
    }
  };

  const handleImageRemove = () => {
    if (image?.file) {
      URL.revokeObjectURL(image.url);
    }
    onImageChange(null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageChange({ url: URL.createObjectURL(file), file });
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {image ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <Image src={image.url} alt={title} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={handleImageRemove}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500 dark:border-gray-600 dark:bg-gray-700"
          >
            <input
              id={inputId}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            <Upload className="mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
            <p className="px-2 text-center text-xs text-gray-500 dark:text-gray-400">
              Drop your image here or click to browse
            </p>
          </div>
        )}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}
