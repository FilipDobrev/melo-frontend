import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useCollections, useToggleSave } from '../../api/cookbook';
import { colors, HIT_SLOP, radius, space } from '../../theme/theme';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
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
  const { data: collections } = useCollections();
  const [confirmVisible, setConfirmVisible] = useState(false);

  function unsave() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave.mutate({ recipeId, saved: false });
  }

  function handlePress() {
    if (!isSaved) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleSave.mutate({ recipeId, saved: true });
      return;
    }

    // Unsaving now removes the recipe from every collection it's filed in,
    // and re-saving doesn't restore those memberships. There's no endpoint
    // that exposes which collections contain a given recipe, so checking
    // that would mean fetching every collection's recipe list. Instead we
    // use a proxy: does this user have any collections at all? A user with
    // none has nothing to lose from a plain unsave. Tighten this to real
    // per-recipe membership if the API ever exposes it.
    if (collections && collections.length > 0) {
      setConfirmVisible(true);
      return;
    }

    unsave();
  }

  // A filled/outline icon pair carries the saved state in shape, not just
  // colour - colour alone is invisible to viewers with colour vision deficiency.
  const iconName: keyof typeof MaterialIcons.glyphMap = isSaved ? 'bookmark' : 'bookmark-border';

  const confirmDialog = (
    <ConfirmDialog
      visible={confirmVisible}
      title="Remove from your cookbook?"
      body="This also removes it from any collections you've filed it in. You can save it again, but you'll need to re-add it to those collections."
      confirmLabel="Remove"
      destructive
      onCancel={() => setConfirmVisible(false)}
      onConfirm={() => {
        setConfirmVisible(false);
        unsave();
      }}
    />
  );

  if (variant === 'labelled') {
    return (
      <>
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
        {confirmDialog}
      </>
    );
  }

  return (
    <>
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
      {confirmDialog}
    </>
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
