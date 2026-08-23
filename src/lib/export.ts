import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function buildFilename(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `melo-data-${today}.json`;
}

// expo-file-system's web build is a stub (its FileSystemFile class has a
// constructor and nothing else), so the native File API below only works on
// native - web gets its own Blob-based implementation instead.
async function saveNative(json: string): Promise<void> {
  // Paths.cache, not Paths.document: this is a transient artefact the user
  // is about to share out immediately, so it is fine for the OS to reclaim
  // it under storage pressure.
  const file = new File(Paths.cache, buildFilename());
  file.create({ overwrite: true });
  file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device, so the export cannot be saved.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Your Melo data',
  });
}

function saveWeb(json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // The anchor is attached before clicking: a detached one is ignored by
  // some browsers, and a download that silently does nothing is the worst
  // possible outcome here.
  const link = window.document.createElement('a');
  link.href = url;
  link.download = buildFilename();
  link.style.display = 'none';
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);

  // Revoked on a later tick, not synchronously: the browser has not
  // necessarily started reading the blob when click() returns, and revoking
  // too early cancels the download. Leaving it un-revoked would pin the
  // whole export in memory for the life of the page.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Writes the export to a file and offers it to the user. Resolves once the
 * share sheet has been presented (native) or the download has started (web).
 */
export async function saveDataExport(data: unknown): Promise<void> {
  // A human opening their own data export should be able to read it.
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web') {
    saveWeb(json);
    return;
  }

  await saveNative(json);
}
