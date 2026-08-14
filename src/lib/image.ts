import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Camera photos carry EXIF metadata including GPS coordinates, so uploading
 * them unmodified publishes the location the photo was taken at to anyone
 * who can fetch the image. Re-encoding strips EXIF; that is the primary
 * reason this step exists.
 *
 * A raw photo is also 3-12 MB, far larger than the feed card it ends up
 * rendered into and larger than the backend's 10 MB limit, so it is
 * downscaled to a sane feed size before upload.
 *
 * The output is always JPEG, which discards PNG transparency. That is
 * acceptable because every image this app uploads is a photograph, never
 * an image that relies on transparency.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

export async function prepareImageForUpload(localUri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(localUri).renderAsync();

  const longEdge = Math.max(original.width, original.height);

  if (longEdge <= MAX_EDGE) {
    const saved = await original.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return saved.uri;
  }

  const landscape = original.width >= original.height;
  const resized = await ImageManipulator.manipulate(original)
    .resize(landscape ? { width: MAX_EDGE } : { height: MAX_EDGE })
    .renderAsync();

  const saved = await resized.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return saved.uri;
}
