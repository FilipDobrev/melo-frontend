import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useToggleSave } from '../../api/cookbook';
import { colors, HIT_SLOP, radius, space } from '../../theme/theme';
import { Text } from '../../ui/Text';

interface SaveRecipeButtonProps {
  recipeId: string;
  isSaved: boolean;
  size?: number;
  variant?: 'icon' | 'labelled';
}

/**
 * `isSaved` is rendered straight from props with no local state -
 * useToggleSave() already patches every cached post optimistically, so a
 * second copy here would just fight the cache.
 */
export function SaveRecipeButton({ recipeId, isSaved, size = 22, variant = 'icon' }: SaveRecipeButtonProps) {
  const toggleSave = useToggleSave();

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave.mutate({ recipeId, saved: !isSaved });
  }

  // A filled/outline icon pair carries the saved state in shape, not just
  // colour - colour alone is invisible to viewers with colour vision deficiency.
  const iconName: keyof typeof MaterialIcons.glyphMap = isSaved ? 'bookmark' : 'bookmark-border';

  if (variant === 'labelled') {
    return (
      <Pressable
        onPress={handlePress}
        style={[styles.pill, isSaved ? styles.pillSaved : styles.pillUnsaved]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSaved }}
        accessibilityLabel={isSaved ? 'Remove from cookbook' : 'Save recipe'}
      >
        <MaterialIcons name={iconName} size={16} color={isSaved ? colors.textInverse : colors.deep} />
        {/* The icon alone didn't tell users what a tap would do, so the
            labelled variant spells out the current state in a word. */}
        <Text variant="strongSm" color={isSaved ? 'textInverse' : 'deep'}>
          {isSaved ? 'Saved' : 'Save'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={HIT_SLOP}
      style={styles.touchArea}
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved }}
      accessibilityLabel={isSaved ? 'Remove from cookbook' : 'Save recipe'}
    >
      <MaterialIcons name={iconName} size={size} color={isSaved ? colors.accent : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    height: 32,
  },
  pillUnsaved: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.deep,
  },
  pillSaved: {
    backgroundColor: colors.deep,
    borderWidth: 1,
    borderColor: colors.deep,
  },
});
