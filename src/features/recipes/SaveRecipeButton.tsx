import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useToggleSave } from '../../api/cookbook';
import { colors, HIT_SLOP } from '../../theme/theme';

interface SaveRecipeButtonProps {
  recipeId: string;
  isSaved: boolean;
  size?: number;
}

/**
 * `isSaved` is rendered straight from props with no local state -
 * useToggleSave() already patches every cached post optimistically, so a
 * second copy here would just fight the cache.
 */
export function SaveRecipeButton({ recipeId, isSaved, size = 22 }: SaveRecipeButtonProps) {
  const toggleSave = useToggleSave();

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave.mutate({ recipeId, saved: !isSaved });
  }

  // A filled/outline icon pair carries the saved state in shape, not just
  // colour - colour alone is invisible to viewers with colour vision deficiency.
  const iconName: keyof typeof MaterialIcons.glyphMap = isSaved ? 'bookmark' : 'bookmark-border';

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
});
