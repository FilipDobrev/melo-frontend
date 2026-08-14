import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Readout } from '../../src/ui/Text';
import { StateView } from '../../src/ui/StateView';
import { Button } from '../../src/ui/Button';
import { HIT_SLOP, cookColors, radius, space } from '../../src/theme/theme';
import { useRecipe } from '../../src/api/recipes';
import { IngredientRow } from '../../src/features/recipes/IngredientRow';

export default function CookModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading, error, refetch } = useRecipe(id);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = useMemo(() => {
    if (!recipe) return [];
    return recipe.instructions
      .split(/\n\s*\n/)
      .map((step) => step.trim())
      .filter((step) => step.length > 0);
  }, [recipe]);

  const totalCount = (recipe?.ingredients.length ?? 0) + steps.length;
  const doneCount = checkedIngredients.size + checkedSteps.size;

  useEffect(() => {
    const target = totalCount > 0 ? doneCount / totalCount : 0;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      Animated.timing(progressAnim, {
        toValue: target,
        duration: reduceMotion ? 0 : 200,
        useNativeDriver: false,
      }).start();
    });
  }, [doneCount, totalCount, progressAnim]);

  function toggleIngredient(ingredientId: string) {
    setCheckedIngredients((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  function toggleStep(index: number) {
    setCheckedSteps((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="light" />
      <StateView isLoading={isLoading} error={error} onRetry={() => void refetch()}>
        {recipe && (
          <>
            <View style={styles.topBar}>
              <Text variant="displayMd" numberOfLines={1} style={[styles.title, styles.textOnDark]}>
                {recipe.title}
              </Text>
              <DarkIconButton name="x" label="Close" onPress={() => router.back()} />
            </View>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <ScrollView contentContainerStyle={styles.body}>
              <Text variant="label" style={[styles.sectionLabel, styles.textMutedOnDark]}>
                INGREDIENTS
              </Text>
              {recipe.ingredients.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  name={ingredient.product.name}
                  quantity={ingredient.quantity}
                  unit={ingredient.unit}
                  dark
                  checked={checkedIngredients.has(ingredient.id)}
                  onToggle={() => toggleIngredient(ingredient.id)}
                />
              ))}

              <Text variant="label" style={[styles.sectionLabel, styles.stepsLabel, styles.textMutedOnDark]}>
                STEPS
              </Text>
              {steps.map((step, index) => {
                const checked = checkedSteps.has(index);
                const showNumber = steps.length > 1;
                return (
                  <Pressable
                    key={index}
                    onPress={() => toggleStep(index)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={showNumber ? `Step ${index + 1}` : 'Step'}
                    accessibilityState={{ checked }}
                    style={styles.stepCard}
                  >
                    {showNumber && (
                      <Readout
                        variant="readoutLg"
                        style={{ color: checked ? cookColors.done : cookColors.accent }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Readout>
                    )}
                    <Text
                      variant="bodyLg"
                      style={[
                        styles.textOnDark,
                        showNumber && styles.stepText,
                        checked && styles.stepTextChecked,
                      ]}
                    >
                      {step}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.bottomBar}>
              <Button
                title="Finish and post"
                size="lg"
                stretch
                onPress={() =>
                  router.replace({ pathname: '/compose/[recipeId]', params: { recipeId: recipe.id } })
                }
              />
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeButton}
                hitSlop={HIT_SLOP}
              >
                <Text variant="strong" style={{ color: cookColors.textMuted }}>
                  Close
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </StateView>
    </SafeAreaView>
  );
}

/**
 * IconButton is fixed to the light `colors` palette, so cook mode's inverted
 * bar needs its own tiny icon button rather than fighting that prop type.
 */
function DarkIconButton({
  name,
  onPress,
  label,
}: {
  name: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.darkIconButton}
    >
      <Feather name={name} size={22} color={cookColors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cookColors.ground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    gap: space.sm,
  },
  title: {
    flex: 1,
  },
  textOnDark: {
    color: cookColors.text,
  },
  textMutedOnDark: {
    color: cookColors.textMuted,
  },
  darkIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    marginHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: cookColors.slab,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: cookColors.accent,
  },
  body: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  sectionLabel: {
    marginBottom: space.sm,
  },
  stepsLabel: {
    marginTop: space.xl,
  },
  stepCard: {
    backgroundColor: cookColors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
  },
  stepText: {
    marginTop: space.sm,
  },
  stepTextChecked: {
    opacity: 0.55,
  },
  bottomBar: {
    backgroundColor: cookColors.surface,
    borderTopWidth: 1,
    borderTopColor: cookColors.line,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
    alignItems: 'center',
  },
  closeButton: {
    paddingVertical: space.sm,
  },
});
