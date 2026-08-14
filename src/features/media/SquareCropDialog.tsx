import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button } from '../../ui/Button';
import { Text } from '../../ui/Text';
import { colors, radius, shadow, space } from '../../theme/theme';

interface SquareCropDialogProps {
  /** Non-null opens the dialog on that local image URI. */
  uri: string | null;
  /** User backed out entirely. The image should be discarded by the caller. */
  onCancel(): void;
  /** User kept the photo uncropped. The caller keeps the ORIGINAL uri. */
  onSkip(): void;
  /** Resolves to a NEW local file URI containing the cropped square. */
  onDone(croppedUri: string): void;
  /** Optional label for the confirm button. Defaults to 'Use photo'. */
  confirmLabel?: string;
}

interface Pan {
  x: number;
  y: number;
}

interface SourceSize {
  width: number;
  height: number;
}

interface Geometry {
  scale: number;
  dispW: number;
  dispH: number;
  maxPanX: number;
  maxPanY: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const THUMB_SIZE = 22;
const CARD_MAX_WIDTH = 340;

function clamp(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(max, Math.max(-max, value));
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// At zoom 1 the short edge of the source exactly fills the viewport, so
// baseScale anchors the whole range; zoom then scales up from there.
function computeGeometry(srcW: number, srcH: number, viewport: number, zoom: number): Geometry {
  const baseScale = viewport / Math.min(srcW, srcH);
  const scale = baseScale * zoom;
  const dispW = srcW * scale;
  const dispH = srcH * scale;
  const maxPanX = Math.max(0, (dispW - viewport) / 2);
  const maxPanY = Math.max(0, (dispH - viewport) / 2);
  return { scale, dispW, dispH, maxPanX, maxPanY };
}

export function SquareCropDialog({
  uri,
  onCancel,
  onSkip,
  onDone,
  confirmLabel = 'Use photo',
}: SquareCropDialogProps): React.ReactElement {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.min(CARD_MAX_WIDTH, windowWidth - space.lg * 2);
  const viewport = cardWidth - space.xl * 2;

  const [srcSize, setSrcSize] = useState<SourceSize | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [cropping, setCropping] = useState(false);

  const geometry = useMemo(
    () => (srcSize ? computeGeometry(srcSize.width, srcSize.height, viewport, zoom) : null),
    [srcSize, viewport, zoom],
  );

  // PanResponder handlers are created once (see refs below) and must read
  // current values through a ref rather than closing over render state.
  const latestRef = useRef({
    pan,
    maxPanX: geometry?.maxPanX ?? 0,
    maxPanY: geometry?.maxPanY ?? 0,
    srcW: srcSize?.width ?? 0,
    srcH: srcSize?.height ?? 0,
    viewport,
  });
  latestRef.current = {
    pan,
    maxPanX: geometry?.maxPanX ?? 0,
    maxPanY: geometry?.maxPanY ?? 0,
    srcW: srcSize?.width ?? 0,
    srcH: srcSize?.height ?? 0,
    viewport,
  };

  const panStartRef = useRef<Pan>({ x: 0, y: 0 });
  const trackRef = useRef({ pageX: 0, width: 0 });
  const trackViewRef = useRef<View>(null);

  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    setSrcSize(null);
    setLoadError(null);
    setPan({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);

    ImageManipulator.manipulate(uri)
      .renderAsync()
      .then((ref) => {
        if (cancelled) return;
        setSrcSize({ width: ref.width, height: ref.height });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Could not load the photo.');
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  // Plain state (not Animated) because the crop routine needs to read the
  // exact pan/zoom synchronously; an Animated.Value can't be read reliably.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStartRef.current = latestRef.current.pan;
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        const { maxPanX, maxPanY } = latestRef.current;
        setPan({
          x: clamp(panStartRef.current.x + gesture.dx, maxPanX),
          y: clamp(panStartRef.current.y + gesture.dy, maxPanY),
        });
      },
    }),
  ).current;

  function measureTrack() {
    trackViewRef.current?.measure((_x, _y, width, _height, pageX) => {
      trackRef.current = { pageX, width };
    });
  }

  function applyZoomFromPageX(pageX: number) {
    const { width, pageX: trackPageX } = trackRef.current;
    if (width <= 0) return;
    const ratio = clampRatio((pageX - trackPageX) / width);
    const newZoom = MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM);
    const { srcW, srcH, viewport: vp } = latestRef.current;
    if (srcW <= 0 || srcH <= 0) return;
    // Re-clamp pan against the new zoom: staying at the old max would leave
    // a gap at the edge of the square once the image shrinks.
    const { maxPanX, maxPanY } = computeGeometry(srcW, srcH, vp, newZoom);
    setZoom(newZoom);
    setPan((prev) => ({ x: clamp(prev.x, maxPanX), y: clamp(prev.y, maxPanY) }));
  }

  const zoomResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        applyZoomFromPageX(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        applyZoomFromPageX(gesture.moveX);
      },
    }),
  ).current;

  async function handleConfirm() {
    if (!uri || !srcSize) return;
    setCropping(true);
    try {
      const { scale } = computeGeometry(srcSize.width, srcSize.height, viewport, zoom);

      // Convert the on-screen pan/zoom into a crop rectangle in source
      // pixels: find the centre the viewport is currently showing, then
      // take a `viewport / scale` square around it.
      const cropSize = viewport / scale;
      const centreX = srcSize.width / 2 - pan.x / scale;
      const centreY = srcSize.height / 2 - pan.y / scale;
      const originX = centreX - cropSize / 2;
      const originY = centreY - cropSize / 2;

      // A rect even a fraction of a pixel outside the source throws, so
      // clamp and round before handing it to the manipulator.
      const size = Math.floor(Math.min(cropSize, srcSize.width, srcSize.height));
      const x = Math.round(Math.min(Math.max(originX, 0), srcSize.width - size));
      const y = Math.round(Math.min(Math.max(originY, 0), srcSize.height - size));

      const cropped = await ImageManipulator.manipulate(uri)
        .crop({ originX: x, originY: y, width: size, height: size })
        .renderAsync();

      // 0.9 here, not the 0.8 used for uploads: this file gets re-encoded a
      // second time by src/lib/image.ts on upload, and compounding two lossy
      // passes at 0.8 is visibly worse than 0.9 followed by 0.8.
      const saved = await cropped.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
      onDone(saved.uri);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not crop the photo.');
    } finally {
      setCropping(false);
    }
  }

  const fillPct = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  return (
    <Modal
      visible={uri !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onCancel}>
        <Pressable
          style={[styles.card, { maxWidth: CARD_MAX_WIDTH }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text variant="displayMd">Position the photo</Text>

          {!uri || (!srcSize && !loadError) ? (
            <View style={[styles.viewport, { width: viewport, height: viewport }]}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null}

          {loadError && (
            <View style={[styles.viewport, { width: viewport, height: viewport }]}>
              <Text variant="bodySm" color="danger" align="center" style={styles.errorText}>
                {loadError}
              </Text>
            </View>
          )}

          {uri && srcSize && geometry && (
            <>
              <View
                style={[styles.viewport, { width: viewport, height: viewport }]}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri }}
                  // contentFit="fill" because we size the image explicitly to
                  // dispW/dispH ourselves; any other fit mode would apply a
                  // second scale and break the crop-rect maths below.
                  contentFit="fill"
                  style={{
                    position: 'absolute',
                    width: geometry.dispW,
                    height: geometry.dispH,
                    left: (viewport - geometry.dispW) / 2,
                    top: (viewport - geometry.dispH) / 2,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                  }}
                />
              </View>

              <Text variant="bodySm" color="textMuted" align="center" style={styles.hint}>
                Drag to reposition.
              </Text>

              <View style={styles.zoomSection}>
                <Text variant="label" color="textMuted">
                  ZOOM
                </Text>
                <View
                  ref={trackViewRef}
                  onLayout={measureTrack}
                  style={styles.track}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Zoom"
                  accessibilityValue={{ min: MIN_ZOOM, max: MAX_ZOOM, now: zoom }}
                  {...zoomResponder.panHandlers}
                >
                  <View style={styles.trackBase} />
                  <View style={[styles.trackFill, { width: `${fillPct}%` }]} />
                  <View
                    style={[
                      styles.thumb,
                      { left: `${fillPct}%`, transform: [{ translateX: -THUMB_SIZE / 2 }] },
                    ]}
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Button title="Use full photo" variant="ghost" onPress={onSkip} disabled={cropping} />
            <View style={styles.confirmWrap}>
              <Button
                title={confirmLabel}
                onPress={handleConfirm}
                loading={cropping}
                disabled={cropping || !srcSize}
                stretch
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    ...shadow.float,
  },
  viewport: {
    alignSelf: 'center',
    marginTop: space.md,
    overflow: 'hidden',
    backgroundColor: colors.slab,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    paddingHorizontal: space.lg,
  },
  hint: {
    marginTop: space.sm,
  },
  zoomSection: {
    marginTop: space.md,
  },
  track: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    marginTop: space.sm,
  },
  trackBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.slab,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    ...shadow.lift,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  confirmWrap: {
    flex: 1,
  },
});
