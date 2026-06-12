/**
 * ASTEYA Security Utilities
 *
 * Centralized security helpers for input validation, sanitization, and safe operations.
 */

// ==================== Input Validation ====================

/**
 * Sanitizes HTML string to prevent XSS attacks
 * Uses a whitelist approach for allowed tags
 */
export const sanitizeHTML = (input: string, allowedTags: string[] = []): string => {
  if (!input) return "";

  // Strip all HTML tags if none allowed
  if (allowedTags.length === 0) {
    return input.replace(/<[^>]*>/g, "");
  }

  return input.replace(/<[^>]*>/g, "");
};

/**
 * Validates and sanitizes email address
 */
export const validateEmail = (email: string): { valid: boolean; sanitized?: string } => {
  if (!email || typeof email !== "string") {
    return { valid: false };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return { valid: false };
  }

  return { valid: true, sanitized: trimmed };
};

/**
 * Validates product data for admin endpoints
 */
export interface ProductInput {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  materials?: string[];
  images?: string[];
}

export const validateProductInput = (data: ProductInput): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.name && (data.name.length < 3 || data.name.length > 200)) {
    errors.push("Product name must be between 3-200 characters");
  }

  if (data.price !== undefined) {
    if (typeof data.price !== "number" || data.price < 0 || data.price > 1000000) {
      errors.push("Price must be a number between 0 and 1,000,000");
    }
  }

  if (data.category && !["rings", "necklaces", "earrings", "bracelets"].includes(data.category)) {
    errors.push("Category must be one of: rings, necklaces, earrings, bracelets");
  }

  if (data.description && data.description.length > 2000) {
    errors.push("Description must be under 2000 characters");
  }

  if (data.materials && !Array.isArray(data.materials)) {
    errors.push("Materials must be an array");
  }

  if (data.materials) {
    data.materials.forEach((material, i) => {
      if (typeof material !== "string" || material.length > 200) {
        errors.push(`Material at index ${i} must be a string under 200 characters`);
      }
    });
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push("Images must be an array");
  }

  if (data.images) {
    data.images.forEach((url, i) => {
      if (typeof url !== "string" || !url.startsWith("http")) {
        errors.push(`Image at index ${i} must be a valid HTTP/HTTPS URL`);
      }
      if (url.toLowerCase().includes("javascript:")) {
        errors.push(`Image at index ${i} contains invalid protocol`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validates image URL to prevent XSS via javascript: URLs
 */
export const sanitizeImageUrl = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:")) {
    return null;
  }

  if (url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return null;
};

/**
 * Validates and limits file upload types
 */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "model/gltf-binary",
  "text/plain"
]);

export const validateMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
};

/**
 * Validates file extension
 */
const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".glb", ".gltf",
  ".txt"
]);

export const validateFileExtension = (fileName: string): boolean => {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

/**
 * Sanitizes file name to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  let sanitizedName = fileName.replace(/[\/\\]/g, "_").replace(/\0/g, "");
  sanitizedName = sanitizedName.replace(/^\./, "");

  if (sanitizedName.length > 255) {
    const parts = sanitizedName.split(".");
    const ext = parts.pop() || "";
    const name = parts.join(".");
    sanitizedName = name.substring(0, 250 - ext.length) + "." + ext;
  }

  return sanitizedName || "unnamed_file";
};

// ==================== Server-Side Admin Check ====================

/**
 * Server-side admin verification
 */
export const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();

  const ADMIN_EMAILS = [
    "admin@asteya.com",
    "pushk@asteya-paris.com",
    "pushk@asteya.com",
    "pushkarsaluja2008@gmail.com",
  ];

  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail);
};

/**
 * Logs security-relevant events
 */
export const logSecurityEvent = (event: string, details: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY ${timestamp}] ${event}`, JSON.stringify(details));
};