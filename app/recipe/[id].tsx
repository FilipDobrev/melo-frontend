import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/ui/Screen';
import { StateView } from '../../src/ui/StateView';
import { Text } from '../../src/ui/Text';
import { IconButton } from '../../src/ui/IconButton';
import { Avatar } from '../../src/ui/Avatar';
import { Chip } from '../../src/ui/Chip';
import { Button } from '../../src/ui/Button';
import { Sheet } from '../../src/ui/Sheet';
import { ConfirmDialog } from '../../src/ui/ConfirmDialog';
import { colors, space } from '../../src/theme/theme';
import { useCurrentUser } from '../../src/auth/AuthContext';
import { useRecipe, useDeleteRecipe } from '../../src/api/recipes';
import { CollectionPickerSheet } from '../../src/features/collections/CollectionPickerSheet';
import { NutritionPanel } from '../../src/features/recipes/NutritionPanel';
import { IngredientRow } from '../../src/features/recipes/IngredientRow';
import { SaveRecipeButton } from '../../src/features/recipes/SaveRecipeButton';

/** Sticky bar: space.md top padding + a 52px lg Button + a 1px hairline. */
const BOTTOM_BAR_HEIGHT = space.md + 52 + 1;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error, refetch } = useRecipe(id);
  const currentUser = useCurrentUser();
  const deleteRecipe = useDeleteRecipe();

  const [overflowVisible, setOverflowVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const isOwner = !!recipe && !!currentUser && recipe.owner.id === currentUser.id;
  const paragraphs = recipe ? recipe.instructions.split(/\n\s*\n/).filter((p) => p.trim().length > 0) : [];

  function handleDelete() {
    setConfirmDeleteVisible(false);
    if (!recipe) return;
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => router.back(),
    });
  }

  return (
    <Screen edges={['top']}>
      <StateView isLoading={isLoading} error={error} onRetry={() => void refetch()}>
        {recipe && (
          <>
            <ScrollView contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + (insets.bottom || space.md) + space.xl }}>
              <View style={styles.hero}>
                <Image
                  source={{ uri: recipe.imageUrl }}
                  contentFit="cover"
                  style={[styles.heroImage, { backgroundColor: colors.slab }]}
                />
                <View style={[styles.heroButton, styles.heroButtonLeft]}>
                  <IconButton name="chevron-left" onPress={() => router.back()} label="Go back" color="textInverse" />
                </View>
                {/* Visible to every viewer now: "Add to a collection" below is a
                    normal thing to do with someone else's recipe, not just your own. */}
                <View style={[styles.heroButton, styles.heroButtonRight]}>
                  <IconButton
                    name="more-horizontal"
                    onPress={() => setOverflowVisible(true)}
                    label="More options"
                    color="textInverse"
                  />
                </View>
              </View>

              <Text variant="displayXl" style={styles.title}>
                {recipe.title}
              </Text>

              <Pressable
                onPress={() => router.push({ pathname: '/user/[id]', params: { id: recipe.owner.id } })}
                accessibilityRole="button"
                accessibilityLabel={recipe.owner.username}
                style={styles.ownerRow}
              >
                <Avatar uri={recipe.owner.profileImage} username={recipe.owner.username} size={28} />
                <Text variant="strong">{recipe.owner.username}</Text>
              </Pressable>

              {recipe.categories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipRow}
                >
                  {recipe.categories.map((category) => (
                    <Chip key={category.slug} label={category.name} />
                  ))}
                </ScrollView>
              )}

              <Text variant="bodyLg" color="textMuted" style={styles.description}>
                {recipe.description}
              </Text>

              <View style={styles.section}>
                <NutritionPanel nutrition={recipe.nutrition} />
              </View>

              <View style={styles.section}>
                <Text variant="label" color="textMuted" style={styles.sectionHeader}>
                  INGREDIENTS
                </Text>
                <View style={styles.ingredientList}>
                  {recipe.ingredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.id}
                      name={ingredient.product.name}
                      quantity={ingredient.quantity}
                      unit={ingredient.unit}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text variant="label" color="textMuted" style={styles.sectionHeader}>
                  INSTRUCTIONS
                </Text>
                <View style={styles.instructions}>
                  {paragraphs.map((paragraph, index) => (
                    <Text key={index} variant="bodyLg" style={index > 0 ? styles.paragraphGap : undefined}>
                      {paragraph.trim()}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom || space.md }]}>
              <View style={styles.bottomBarButton}>
                <Button
                  title="Start cooking"
                  size="lg"
                  stretch
                  onPress={() => router.push({ pathname: '/cook/[id]', params: { id: recipe.id } })}
                />
              </View>
              {isOwner && (
                <IconButton
                  name="edit-3"
                  onPress={() => router.push({ pathname: '/recipe/[id]/edit', params: { id: recipe.id } })}
                  label="Edit recipe"
                />
              )}
              <SaveRecipeButton recipeId={recipe.id} isSaved={recipe.isSaved} />
            </View>

            <Sheet visible={overflowVisible} onClose={() => setOverflowVisible(false)} heightRatio={isOwner ? 0.42 : 0.21}>
              <Pressable
                onPress={() => {
                  setOverflowVisible(false);
                  setPickerRecipeId(recipe.id);
                }}
                accessibilityRole="button"
                accessibilityLabel="Add to a collection"
                style={styles.sheetRow}
              >
                <Feather name="folder-plus" size={18} color={colors.text} />
                <Text variant="body">Add to a collection</Text>
              </Pressable>
              {isOwner && (
                <Pressable
                  onPress={() => {
                    setOverflowVisible(false);
                    router.push({ pathname: '/recipe/[id]/edit', params: { id: recipe.id } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit recipe"
                  style={styles.sheetRow}
                >
                  <Feather name="edit-3" size={18} color={colors.text} />
                  <Text variant="body">Edit recipe</Text>
                </Pressable>
              )}
              {isOwner && (
                <Pressable
                  onPress={() => {
                    setOverflowVisible(false);
                    setConfirmDeleteVisible(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Delete recipe"
                  style={styles.sheetRow}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                  <Text variant="body" color="danger">
                    Delete recipe
                  </Text>
                </Pressable>
              )}
            </Sheet>

            <CollectionPickerSheet recipeId={pickerRecipeId} onClose={() => setPickerRecipeId(null)} />

            <ConfirmDialog
              visible={confirmDeleteVisible}
              title="Delete recipe"
              body="This also removes it from everyone's cookbooks."
              confirmLabel="Delete"
              destructive
              onConfirm={handleDelete}
              onCancel={() => setConfirmDeleteVisible(false)}
            />
          </>
        )}
      </StateView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroButton: {
    position: 'absolute',
    top: space.md,
    borderRadius: 999,
    backgroundColor: colors.scrimSoft,
  },
  // Matches ScreenHeader's back chevron: the IconButton's own ~9px inset plus
  // this lands the glyph on the same margin as every other screen's back arrow.
  heroButtonLeft: {
    left: space.sm,
  },
  heroButtonRight: {
    right: space.sm,
  },
  title: {
    marginHorizontal: space.lg,
    marginTop: space.lg,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginTop: space.md,
  },
  // A ScrollView defaults to flexGrow 1; pinned to 0 so a horizontal one can
  // never claim vertical space beyond its single row of chips.
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: space.sm,
    marginHorizontal: space.lg,
    marginTop: space.md,
  },
  description: {
    marginHorizontal: space.lg,
    marginTop: space.md,
  },
  section: {
    marginTop: space.xl,
  },
  sectionHeader: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
  },
  ingredientList: {
    marginHorizontal: space.lg,
  },
  instructions: {
    marginHorizontal: space.lg,
  },
  paragraphGap: {
    marginTop: space.md,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  bottomBarButton: {
    flex: 1,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
