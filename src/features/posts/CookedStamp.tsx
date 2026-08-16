import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Post } from '../../api/schemas';
import { formatMacros } from '../../lib/format';
import { colors, radius, space } from '../../theme/theme';
import { Readout, Text } from '../../ui/Text';

interface CookedStampProps {
  recipe: Post['recipe'];
}

/** The signature strip: purely informational, tap anywhere to open the recipe. */
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
      <Pressable
        style={styles.titleRow}
        onPress={openRecipe}
        accessibilityRole="link"
        accessibilityLabel={`View recipe: ${recipe.title}`}
      >
        <Text variant="displaySm" color="text" numberOfLines={2}>
          {recipe.title}
        </Text>
      </Pressable>
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
    marginTop: space.md,
    padding: space.md,
  },
  titleRow: {
    marginVertical: space.xs,
  },
});
