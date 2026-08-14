import type { UploadTicket } from '../api/schemas';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Storage only accepts these three types; a blob's own MIME type can be empty or wrong. */
function resolveContentType(blob: Blob, localUri: string): string {
  if (SUPPORTED_TYPES.has(blob.type)) return blob.type;

  const extension = localUri.split('.').pop()?.toLowerCase().split(/[?#]/)[0];
  const inferred = extension ? EXTENSION_TYPES[extension] : undefined;
  if (inferred) return inferred;

  throw new Error('Melo supports JPEG, PNG and WebP images.');
}

/**
 * Uploads one local image and returns its storage key. The presigned PUT
 * signature covers `contentType` and `contentLength`, so both must be the
 * actual measured values from the blob, never estimated or guessed.
 */
export async function uploadImage(
  localUri: string,
  requestTicket: (contentType: string, contentLength: number) => Promise<UploadTicket>,
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const contentType = resolveContentType(blob, localUri);
  const contentLength = blob.size;
  if (contentLength === 0) throw new Error('That image could not be read. Pick it again.');

  const ticket = await requestTicket(contentType, contentLength);

  // Content-Length is set by the runtime; setting it manually can break the
  // presigned signature storage checks against.
  const uploadResponse = await fetch(ticket.uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  if (!uploadResponse.ok) throw new Error('Upload failed. Try again.');

  return ticket.storageKey;
}

/**
 * Uploads sequentially rather than in parallel: a presigned URL has a 5
 * minute TTL, parallel large uploads are worse on mobile data, and sequential
 * uploads let progress be reported honestly after each one completes.
 */
export async function uploadImages(
  localUris: string[],
  requestTicket: (contentType: string, contentLength: number) => Promise<UploadTicket>,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const storageKeys: string[] = [];
  for (const localUri of localUris) {
    storageKeys.push(await uploadImage(localUri, requestTicket));
    onProgress?.(storageKeys.length, localUris.length);
  }
  return storageKeys;
}
