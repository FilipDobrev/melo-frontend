import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRecipe } from '../../src/hooks/useRecipes';
import { ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';
import { formatUnit } from '../../src/lib/units';

function splitSteps(instructions: string): string[] {
  const lines = instructions
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 ? lines : [instructions];
}

export default function CookScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const router = useRouter();
  const recipeQuery = useRecipe(recipeId);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const steps = useMemo(() => (recipeQuery.data ? splitSteps(recipeQuery.data.instructions) : []), [recipeQuery.data]);

  if (recipeQuery.isLoading) {
    return <LoadingState />;
  }
  if (recipeQuery.isError || !recipeQuery.data) {
    return (
      <ErrorState
        message={recipeQuery.error instanceof ApiError ? recipeQuery.error.message : 'Could not load this recipe.'}
        onRetry={recipeQuery.refetch}
      />
    );
  }

  const recipe = recipeQuery.data;

  function toggleIngredient(id: string) {
    setCheckedIngredients((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleStep(index: number) {
    setCheckedSteps((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleCooked() {
    router.push({ pathname: '/post/new', params: { recipeId: recipe.id } });
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient) => {
          const checked = checkedIngredients.has(ingredient.id);
          return (
            <TouchableOpacity
              key={ingredient.id}
              style={styles.checkRow}
              onPress={() => toggleIngredient(ingredient.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>
                {ingredient.quantity} {formatUnit(ingredient.unit)} {ingredient.product.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionTitle}>Steps</Text>
        {steps.map((step, index) => {
          const checked = checkedSteps.has(index);
          return (
            <TouchableOpacity
              key={index}
              style={styles.checkRow}
              onPress={() => toggleStep(index)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>{step}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cookedButton} onPress={handleCooked}>
          <Text style={styles.cookedButtonText}>Cooked</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B2620',
    marginTop: 20,
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#B5541A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#B5541A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: '#2B2620',
    lineHeight: 21,
  },
  checkLabelChecked: {
    color: '#8A7F70',
    textDecorationLine: 'line-through',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5DDD0',
    backgroundColor: '#FFFBF5',
  },
  cookedButton: {
    backgroundColor: '#B5541A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cookedButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
