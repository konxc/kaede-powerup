// @ts-nocheck — file ini adalah port langsung dari JS, akan diperbaiki tipenya bertahap

/**
 * KAEDE Attachments Utility
 *
 * Utilities untuk mengelola attachments di Trello cards.
 * Ported dari delorenj/mcp-server-trello dengan adaptasi ke fetch-based API.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, extname, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── MIME Types ───

export const MIME_TYPES: Readonly<Record<string, string>> = Object.freeze({
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.log': 'text/plain',

  // Code
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.jsx': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',

  // Media
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
});

const DEFAULT_MIME_TYPE = 'application/octet-stream';

// ─── Helper Functions ───

/**
 * Get MIME type from filename extension
 * @param filename - Filename with extension
 * @returns MIME type
 */
export function mimeFromFilename(filename?: string): string | undefined {
  if (!filename) return undefined;
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || DEFAULT_MIME_TYPE;
}

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type
 * @returns File extension (with dot)
 */
export function extensionFromMime(mimeType: string): string {
  const match = Object.entries(MIME_TYPES).find(([, mime]) => mime === mimeType);
  return match ? match[0] : '';
}

/**
 * Convert file URL to local path
 * @param fileUrl - file:// URL
 * @returns Local file path
 */
export function fileUrlToPath(fileUrl: string): string {
  try {
    return fileURLToPath(fileUrl);
  } catch (error) {
    throw new Error(`Invalid file URL: ${fileUrl}`);
  }
}

/**
 * Check if URL is valid
 * @param url - URL to validate
 * @returns True if valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get filename from URL
 * @param url - URL
 * @returns Filename
 */
export function filenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return basename(pathname) || 'attachment';
  } catch {
    return 'attachment';
  }
}

/**
 * Create FormData for file attachment
 * @param file - File data or stream
 * @param filename - Filename
 * @param mimeType - MIME type
 * @returns FormData object
 */
export function createAttachmentFormData(file: Buffer | Blob, filename: string, mimeType: string): FormData {
  const formData = new FormData();
  // Wrap Buffer in Blob for Node.js compatibility (Node 18+ FormData requires Blob)
  const blob = Buffer.isBuffer(file) ? new Blob([file]) : file;
  formData.append('file', blob, {
    filename,
    contentType: mimeType,
  });
  formData.append('name', filename);
  formData.append('mimeType', mimeType);
  return formData;
}

/**
 * Create FormData for URL attachment
 * @param url - File URL
 * @param name - Attachment name
 * @param mimeType - MIME type
 * @returns URLSearchParams
 */
export function createUrlAttachmentData(url: string, name: string, mimeType: string): URLSearchParams {
  return new URLSearchParams({
    url,
    name,
    mimeType,
  });
}
