import type { UploadTicket } from '../api/schemas';
import { prepareImageForUpload } from './image';

// prepareImageForUpload always re-encodes to JPEG, so the content type is
// no longer guessed from the picker's output.
const UPLOAD_CONTENT_TYPE = 'image/jpeg';

// Mirrors the backend's limit in backend/src/services/storage.service.ts.
// Downscaling should make this unreachable; asserting it catches a broken
// prepareImageForUpload rather than silently uploading a rejected file.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Uploads one local image and returns its storage key. The image is
 * downscaled and re-encoded first (see ./image.ts), both to shrink it and to
 * strip EXIF/GPS metadata. The presigned PUT signature covers `contentType`
 * and `contentLength`, so both must be measured from the prepared file that
 * is actually sent, never the original picker output — otherwise the bytes
 * PUT won't match what the signature covers and storage returns a 403.
 */
export async function uploadImage(
  localUri: string,
  requestTicket: (contentType: string, contentLength: number) => Promise<UploadTicket>,
): Promise<string> {
  const preparedUri = await prepareImageForUpload(localUri);
  const response = await fetch(preparedUri);
  const blob = await response.blob();

  const contentType = UPLOAD_CONTENT_TYPE;
  const contentLength = blob.size;
  if (contentLength === 0) throw new Error('That image could not be read. Pick it again.');
  if (contentLength > MAX_UPLOAD_BYTES) throw new Error('That image is too large to upload.');

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
