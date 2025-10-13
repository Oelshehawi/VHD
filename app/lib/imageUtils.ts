/**
 * Convert image to base64 for use in PDFs (server-side only)
 * @param imagePath - path to image relative to public directory
 * @returns base64 data URL
 */
export function getImageAsBase64(imagePath: string): string {
  // Check if we're in a Node.js environment (server-side)
  if (typeof window === "undefined") {
    try {
      // Dynamic import to avoid bundling fs for client-side
      const fs = require("fs");
      const path = require("path");

      const fullPath = path.join(process.cwd(), "public", imagePath);
      const imageBuffer = fs.readFileSync(fullPath);
      const base64 = imageBuffer.toString("base64");

      // Determine MIME type based on file extension
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = "image/png"; // default

      switch (ext) {
        case ".jpg":
        case ".jpeg":
          mimeType = "image/jpeg";
          break;
        case ".png":
          mimeType = "image/png";
          break;
        case ".gif":
          mimeType = "image/gif";
          break;
        case ".svg":
          mimeType = "image/svg+xml";
          break;
        case ".webp":
          mimeType = "image/webp";
          break;
      }

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return ""; // Return empty string if image can't be loaded
    }
  }

  // Client-side: return empty string (will use public URL fallback)
  return "";
}

/**
 * Get image source that works in both client and server contexts
 * @param imagePath - path to image relative to public directory
 * @returns appropriate image source
 */
export function getImageSrc(imagePath: string): string {
  // Server-side: use base64
  if (typeof window === "undefined") {
    const base64 = getImageAsBase64(imagePath);
    return base64 || `/${imagePath}`; // fallback to public URL
  }

  // Client-side: use public URL
  return `/${imagePath}`;
}

/**
 * Extract Cloudinary public_id from full URL
 * @param url - Cloudinary full URL (e.g., https://res.cloudinary.com/cloud/image/upload/v123/path/name.jpg)
 * @returns public_id without version and extension, or null if invalid
 */
export function toPublicId(url: string): string | null {
  if (!url) return null;

  try {
    // Match pattern: /image/upload/[v<version>/]<public_id>[.<ext>]
    // This regex captures the public_id after /upload/ (with optional version)
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);

    if (match && match[1]) {
      // Remove file extension if present
      const publicId = match[1].replace(/\.[^.]+$/, '');
      return publicId;
    }

    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
}
