"use client"

const MAX_BLOG_IMAGE_BYTES = 8 * 1024 * 1024

export async function uploadBlogImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.")
  }

  if (file.size > MAX_BLOG_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 8 MB.")
  }

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/blogs/upload-image", {
    method: "POST",
    body: formData,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || "Failed to upload image.")
  }

  return data.url as string
}

export interface ImagePreview {
  url: string
  file?: File
}

/**
 * Resolves the image URL to save for a blog field.
 * Returns `undefined` when the image was not changed (edit mode).
 */
export async function resolveBlogImageForSave(
  image: ImagePreview | null,
  initialUrl: string | null | undefined
): Promise<string | null | undefined> {
  if (!image) {
    return initialUrl ? null : undefined
  }

  if (image.file) {
    return uploadBlogImage(image.file)
  }

  if (image.url === initialUrl) {
    return undefined
  }

  if (image.url.startsWith("data:")) {
    return image.url
  }

  return image.url
}
