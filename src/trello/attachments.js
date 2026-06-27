/**
 * KAEDE Attachments Utility
 * 
 * Utilities untuk mengelola attachments di Trello cards.
 * Ported dari delorenj/mcp-server-trello dengan adaptasi ke fetch-based API.
 */

import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── MIME Types ───

export const MIME_TYPES = Object.freeze({
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
 * @param {string} filename - Filename with extension
 * @returns {string} MIME type
 */
export function mimeFromFilename(filename) {
  if (!filename) return undefined;
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || DEFAULT_MIME_TYPE;
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension (with dot)
 */
export function extensionFromMime(mimeType) {
  const match = Object.entries(MIME_TYPES).find(([, mime]) => mime === mimeType);
  return match ? match[0] : '';
}

/**
 * Convert file URL to local path
 * @param {string} fileUrl - file:// URL
 * @returns {string} Local file path
 */
export function fileUrlToPath(fileUrl) {
  try {
    return fileURLToPath(fileUrl);
  } catch (error) {
    throw new Error(`Invalid file URL: ${fileUrl}`);
  }
}

/**
 * Check if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get filename from URL
 * @param {string} url - URL
 * @returns {string} Filename
 */
export function filenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    return basename(pathname) || 'attachment';
  } catch {
    return 'attachment';
  }
}

/**
 * Create FormData for file attachment
 * @param {Buffer|ReadStream} file - File data or stream
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 * @returns {FormData} FormData object
 */
export function createAttachmentFormData(file, filename, mimeType) {
  const formData = new FormData();
  formData.append('file', file, {
    filename: filename,
    contentType: mimeType,
  });
  formData.append('name', filename);
  formData.append('mimeType', mimeType);
  return formData;
}

/**
 * Create FormData for URL attachment
 * @param {string} url - File URL
 * @param {string} name - Attachment name
 * @param {string} mimeType - MIME type
 * @returns {URLSearchParams} Form data
 */
export function createUrlAttachmentData(url, name, mimeType) {
  return new URLSearchParams({
    url: url,
    name: name,
    mimeType: mimeType,
  });
}