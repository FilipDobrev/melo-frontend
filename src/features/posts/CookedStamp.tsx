import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useToggleSave } from '../../api/cookbook';
import type { Post } from '../../api/schemas';
import { formatMacros } from '../../lib/format';
import { colors, radius, space } from '../../theme/theme';
import { IconButton } from '../../ui/IconButton';
import { Readout, Text } from '../../ui/Text';

interface CookedStampProps {
  recipe: Post['recipe'];
}

/**
 * The signature strip. `recipe.isSaved` is rendered straight from props with
 * no local state - useToggleSave() already patches every cached post
 * optimistically, so holding a second copy here would just fight the cache.
 */
export function CookedStamp({ recipe }: CookedStampProps) {
  const toggleSave = useToggleSave();

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
          style={styles.titlePressable}
          onPress={openRecipe}
          accessibilityRole="link"
          accessibilityLabel={`View recipe: ${recipe.title}`}
        >
          <Text variant="displaySm" color="text" numberOfLines={2}>
            {recipe.title}
          </Text>
        </Pressable>
        <View style={[styles.saveBackground, recipe.isSaved && styles.saveBackgroundActive]}>
          <IconButton
            name="bookmark"
            size={18}
            color={recipe.isSaved ? 'accent' : 'textMuted'}
            label={recipe.isSaved ? 'Remove from cookbook' : 'Save recipe'}
            onPress={() => toggleSave.mutate({ recipeId: recipe.id, saved: !recipe.isSaved })}
          />
        </View>
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
    marginTop: space.md,
    padding: space.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginVertical: space.xs,
  },
  titlePressable: {
    flex: 1,
  },
  saveBackground: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBackgroundActive: {
    backgroundColor: colors.accentTint,
  },
});
