import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Readout, Text } from '../../ui/Text';
import { colors, radius, space } from '../../theme/theme';

interface RecipeTileRecipe {
  id: string;
  title: string;
  imageUrl: string;
}

interface RecipeTileProps {
  recipe: RecipeTileRecipe;
  kcal?: number;
  width: number;
  onPress?: () => void;
  /** Cookbook and collection grids hang their per-recipe actions off this. */
  onLongPress?: () => void;
}

/** The grid tile used by discover, cookbook, collections and profile. */
export function RecipeTile({ recipe, kcal, width, onPress, onLongPress }: RecipeTileProps) {
  const handlePress =
    onPress ?? (() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } }));

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
      style={{ width }}
    >
      <Image
        source={{ uri: recipe.imageUrl }}
        contentFit="cover"
        transition={180}
        style={[styles.image, { width, height: width, backgroundColor: colors.slab }]}
      />
      <Text variant="displaySm" numberOfLines={2} style={styles.title}>
        {recipe.title}
      </Text>
      {kcal !== undefined && (
        <Readout variant="readoutSm" color="textMuted">
          {`${Math.round(kcal)} kcal`}
        </Readout>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: radius.md,
  },
  title: {
    marginTop: space.sm,
  },
});
