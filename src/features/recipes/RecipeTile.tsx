import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton } from '../../ui/IconButton';
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
  /** Visible overflow control drawn on the image, opening the same actions menu as onLongPress. */
  onOpenActions?: () => void;
}

/** The grid tile used by discover, cookbook, collections and profile. */
export function RecipeTile({ recipe, kcal, width, onPress, onLongPress, onOpenActions }: RecipeTileProps) {
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
      <View>
        <Image
          source={{ uri: recipe.imageUrl }}
          contentFit="cover"
          transition={180}
          style={[styles.image, { width, height: width, backgroundColor: colors.slab }]}
        />
        {onOpenActions && (
          // Sibling view stacked over the image so its own Pressable claims the tap
          // before it can bubble to the tile's Pressable underneath.
          <View style={styles.actionsButton}>
            <IconButton
              name="more-horizontal"
              onPress={onOpenActions}
              label="Recipe options"
              size={18}
              color="textInverse"
            />
          </View>
        )}
      </View>
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
  actionsButton: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.scrimSoft,
  },
  title: {
    marginTop: space.sm,
  },
});
