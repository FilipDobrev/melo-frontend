import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Post } from '../../api/schemas';
import { formatMacros } from '../../lib/format';
import { colors, radius, space } from '../../theme/theme';
import { Readout, Text } from '../../ui/Text';
import { SaveRecipeButton } from '../recipes/SaveRecipeButton';

interface CookedStampProps {
  recipe: Post['recipe'];
}

/** The signature strip: tap the title or macros to open the recipe, tap the pill to save it. */
export function CookedStamp({ recipe }: CookedStampProps) {
  function openRecipe() {
    router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } });
  }

  return (
    <View style={styles.slab}>
      <Pressable onPress={openRecipe} accessibilityRole="link" accessibilityLabel={`View recipe: ${recipe.title}`}>
        <Text variant="label" color="deep">
          COOKED
        </Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Pressable
          style={styles.titlePress}
          onPress={openRecipe}
          accessibilityRole="link"
          accessibilityLabel={`View recipe: ${recipe.title}`}
        >
          <Text variant="displaySm" color="text" numberOfLines={2}>
            {recipe.title}
          </Text>
        </Pressable>
        <SaveRecipeButton recipeId={recipe.id} isSaved={recipe.isSaved} variant="labelled" />
      </View>
      <Pressable onPress={openRecipe} accessibilityRole="link" accessibilityLabel={`View recipe: ${recipe.title}`}>
        <Readout variant="readoutSm" color="deep">
          {formatMacros(recipe.nutrition)}
        </Readout>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slab: {
    backgroundColor: colors.deepTint,
    borderRadius: radius.md,
    marginHorizontal: space.lg,
    marginTop: space.sm,
    padding: space.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginVertical: space.xs,
  },
  titlePress: {
    flex: 1,
  },
});
