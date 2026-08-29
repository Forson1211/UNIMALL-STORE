import { supabase } from "@/integrations/supabase/client";

export interface ImageOptimizationOptions {
  maxDimension?: number;
  quality?: number;
  format?: "image/webp" | "image/jpeg";
  cacheControl?: string;
}

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
}

export const IMAGE_PRESETS = {
  productMain: { maxDimension: 800, quality: 0.8, format: "image/webp" as const },
  productSlot: { maxDimension: 600, quality: 0.75, format: "image/webp" as const },
  avatar: { maxDimension: 300, quality: 0.8, format: "image/webp" as const },
  banner: { maxDimension: 1200, quality: 0.8, format: "image/webp" as const },
  siteAsset: { maxDimension: 1000, quality: 0.85, format: "image/webp" as const },
};

/**
 * Validates file type and size before processing.
 */
export function validateImageFile(file: File, maxSizeBytes = 15 * 1024 * 1024): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Only image files (JPEG, PNG, WebP, etc.) are allowed" };
  }

  if (file.size > maxSizeBytes) {
    const mbLimit = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `Image file is too large. Maximum size is ${mbLimit}MB` };
  }

  return { valid: true };
}

/**
 * Compresses and resizes an image on the client using HTML5 Canvas.
 * Outputs an optimized WebP (or JPEG) Blob/File ready for storage upload.
 */
export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const maxDim = options.maxDimension || 800;
  const quality = options.quality ?? 0.8;
  const targetFormat = options.format || "image/webp";

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        return reject(new Error("Failed to read image file"));
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            file,
            dataUrl: src,
            width: img.width,
            height: img.height,
            originalSize,
            optimizedSize: originalSize,
          });
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP conversion
        let dataUrl = canvas.toDataURL(targetFormat, quality);
        let mimeType = targetFormat;
        let ext = targetFormat === "image/webp" ? "webp" : "jpg";

        // Check if browser actually generated webp
        if (targetFormat === "image/webp" && !dataUrl.startsWith("data:image/webp")) {
          mimeType = "image/jpeg";
          ext = "jpg";
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                dataUrl: src,
                width,
                height,
                originalSize,
                optimizedSize: originalSize,
              });
            }

            const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const optimizedFile = new File([blob], `${baseName}.${ext}`, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: optimizedFile,
              dataUrl,
              width,
              height,
              originalSize,
              optimizedSize: blob.size,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Could not decode image"));
      };

      img.src = src;
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an image and uploads it to Supabase Storage with a long-term immutable cache-control header.
 */
export async function uploadOptimizedImage(
  bucket: string,
  path: string,
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<{ publicUrl: string; error?: any }> {
  try {
    const { valid, error: validationError } = validateImageFile(file);
    if (!valid) {
      return { publicUrl: "", error: new Error(validationError) };
    }

    const { file: optimizedFile } = await optimizeImageForUpload(file, options);

    // 1-year immutable cache header: 31536000 seconds
    const cacheControl = options.cacheControl || "31536000, immutable";

    const { error: uploadError } = await (supabase.storage as any)
      .from(bucket)
      .upload(path, optimizedFile, {
        upsert: true,
        cacheControl,
        contentType: optimizedFile.type,
      });

    if (uploadError) {
      console.warn(`Upload to bucket '${bucket}' failed:`, uploadError);
      return { publicUrl: "", error: uploadError };
    }

    const { data } = (supabase.storage as any).from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl || "";

    try {
      import("@/lib/egressMonitor").then((m) => m.egressMonitor.recordStorageUpload(bucket, optimizedFile.size));
    } catch (e) {}

    return { publicUrl, error: undefined };
  } catch (err: any) {
    console.error("Image upload exception:", err);
    return { publicUrl: "", error: err };
  }
}
