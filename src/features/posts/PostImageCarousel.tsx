import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../../theme/theme';
import { useContentWidth } from '../../theme/layout';
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

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(image) => image.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <Pressable onPress={handlePress} accessibilityRole="image" accessibilityLabel="Post photo">
            <Image
              source={{ uri: item.url }}
              contentFit="cover"
              transition={180}
              style={{ width, aspectRatio: 1, backgroundColor: colors.slab }}
            />
          </Pressable>
        )}
      />
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
