import { Image } from 'expo-image';
import React, { useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, space } from '../../theme/theme';
import { useContentWidth } from '../../theme/layout';
import { IconButton } from '../../ui/IconButton';
import { Readout } from '../../ui/Text';

interface PostImage {
  id: string;
  url: string;
}

interface PostImageCarouselProps {
  images: PostImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onDoubleTap?: () => void;
}

/** Under this gap between taps, a second tap counts as a double tap. */
const DOUBLE_TAP_MS = 280;

export function PostImageCarousel({ images, index, onIndexChange, onDoubleTap }: PostImageCarouselProps) {
  const width = useContentWidth();
  const lastTapAtRef = useRef(0);
  const listRef = useRef<FlatList<PostImage>>(null);

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== index) onIndexChange(nextIndex);
  }

  function handlePress() {
    const now = Date.now();
    if (now - lastTapAtRef.current < DOUBLE_TAP_MS) {
      onDoubleTap?.();
      lastTapAtRef.current = 0;
    } else {
      lastTapAtRef.current = now;
    }
  }

  function goTo(nextIndex: number) {
    const clampedIndex = Math.max(0, Math.min(nextIndex, images.length - 1));
    listRef.current?.scrollToIndex({ index: clampedIndex, animated: true });
    // onMomentumScrollEnd doesn't fire reliably for programmatic scrolls on web,
    // so update the dots/counter immediately rather than waiting for it.
    onIndexChange(clampedIndex);
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(image) => image.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Pressable onPress={handlePress} accessibilityRole="image" accessibilityLabel="Post photo">
            <Image
              source={{ uri: item.url }}
              // The square frame is a layout constant, not a crop instruction - cropping
              // now happens once, explicitly, before upload, so the renderer must show
              // the whole photo rather than cutting edges off non-square images.
              contentFit="contain"
              transition={180}
              style={{ width, aspectRatio: 1, backgroundColor: colors.slab }}
            />
          </Pressable>
        )}
      />
      {/* Arrows are web-only: touch users swipe (arrows would just be clutter over
          the photo), but a mouse has no swipe gesture, so it needs an alternative.
          Each wrapper spans the full height and is box-none so only the button
          itself takes clicks - otherwise it would swallow taps in a strip down
          the side of the photo and break double-tap-to-react there. */}
      {Platform.OS === 'web' && images.length > 1 && index > 0 && (
        <View style={[styles.arrowWrap, styles.arrowLeft]} pointerEvents="box-none">
          <View style={styles.arrowBackground}>
            <IconButton
              name="chevron-left"
              onPress={() => goTo(index - 1)}
              label="Previous photo"
              color="textInverse"
            />
          </View>
        </View>
      )}
      {Platform.OS === 'web' && images.length > 1 && index < images.length - 1 && (
        <View style={[styles.arrowWrap, styles.arrowRight]} pointerEvents="box-none">
          <View style={styles.arrowBackground}>
            <IconButton
              name="chevron-right"
              onPress={() => goTo(index + 1)}
              label="Next photo"
              color="textInverse"
            />
          </View>
        </View>
      )}
      {images.length > 1 && (
        <View style={styles.counterPill}>
          <Readout variant="readoutSm" color="textInverse">
            {`${index + 1}/${images.length}`}
          </Readout>
        </View>
      )}
      {images.length > 1 && (
        <View style={styles.dotsRow} pointerEvents="none">
          {images.map((image, dotIndex) => (
            <View
              key={image.id}
              style={[
                styles.dot,
                // Dots overlay arbitrary photos, so they need a literal white/black
                // rgba rather than a theme token to stay legible on any image.
                { backgroundColor: dotIndex === index ? colors.textInverse : 'rgba(255,255,255,0.45)' },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  arrowWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  arrowLeft: {
    left: space.sm,
  },
  arrowRight: {
    right: space.sm,
  },
  arrowBackground: {
    backgroundColor: colors.scrimSoft,
    borderRadius: radius.pill,
  },
  counterPill: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    backgroundColor: colors.scrimSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.hair,
  },
  dotsRow: {
    position: 'absolute',
    bottom: space.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
