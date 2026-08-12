import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../../src/hooks/useCategories';
import { useProductSearch } from '../../src/hooks/useProducts';
import { useCreateRecipe } from '../../src/hooks/useCreateRecipe';
import { useRecipe } from '../../src/hooks/useRecipes';
import { updateRecipe, type RecipeIngredientInput } from '../../src/api/recipes.api';
import { ApiError } from '../../src/api/client';
import { ALL_UNITS, formatUnit } from '../../src/lib/units';

type DraftIngredient = RecipeIngredientInput & { productName: string };

export default function RecipeFormScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = Boolean(editId);

  const categoriesQuery = useCategories();
  const existingRecipe = useRecipe(editId ?? '');
  const createRecipe = useCreateRecipe();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const productResults = useProductSearch(productSearch);

  useEffect(() => {
    if (isEditing && existingRecipe.data && !hasPrefilled) {
      const recipe = existingRecipe.data;
      setTitle(recipe.title);
      setDescription(recipe.description);
      setInstructions(recipe.instructions);
      setIngredients(
        recipe.ingredients.map((ingredient) => ({
          productId: ingredient.productId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          productName: ingredient.product.name,
        })),
      );
      setCategorySlugs(recipe.categories.map((category) => category.slug));
      setHasPrefilled(true);
    }
  }, [isEditing, existingRecipe.data, hasPrefilled]);

  function toggleCategory(slug: string) {
    setCategorySlugs((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]));
  }

  function addIngredient(productId: string, productName: string) {
    if (ingredients.some((ingredient) => ingredient.productId === productId)) return;
    setIngredients((current) => [...current, { productId, productName, quantity: 1, unit: 'PIECE' }]);
    setProductSearch('');
  }

  function updateIngredient(productId: string, patch: Partial<Pick<DraftIngredient, 'quantity' | 'unit'>>) {
    setIngredients((current) =>
      current.map((ingredient) => (ingredient.productId === productId ? { ...ingredient, ...patch } : ingredient)),
    );
  }

  function removeIngredient(productId: string) {
    setIngredients((current) => current.filter((ingredient) => ingredient.productId !== productId));
  }

  const canSubmit = title.trim() && description.trim() && instructions.trim() && ingredients.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        ingredients: ingredients.map(({ productId, quantity, unit }) => ({ productId, quantity, unit })),
        categorySlugs,
      };
      const recipe = isEditing && editId ? await updateRecipe(editId, input) : await createRecipe.mutateAsync(input);
      router.replace({ pathname: '/recipe/[id]', params: { id: recipe.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the recipe.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEditing && existingRecipe.isLoading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#4A3F35" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Recipe title" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Short description"
        multiline
      />

      <Text style={styles.label}>Categories</Text>
      <View style={styles.chipRow}>
        {(categoriesQuery.data ?? []).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.chip, categorySlugs.includes(category.slug) && styles.chipActive]}
            onPress={() => toggleCategory(category.slug)}
          >
            <Text style={[styles.chipText, categorySlugs.includes(category.slug) && styles.chipTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Ingredients</Text>
      {ingredients.map((ingredient) => (
        <View key={ingredient.productId} style={styles.ingredientRow}>
          <Text style={styles.ingredientName} numberOfLines={1}>
            {ingredient.productName}
          </Text>
          <TextInput
            style={styles.quantityInput}
            keyboardType="numeric"
            value={String(ingredient.quantity)}
            onChangeText={(text) => {
              const quantity = Number(text);
              if (!Number.isNaN(quantity)) {
                updateIngredient(ingredient.productId, { quantity });
              }
            }}
          />
          <View style={styles.unitRow}>
            {ALL_UNITS.map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[styles.unitChip, ingredient.unit === unit && styles.unitChipActive]}
                onPress={() => updateIngredient(ingredient.productId, { unit })}
              >
                <Text style={[styles.unitChipText, ingredient.unit === unit && styles.unitChipTextActive]}>
                  {formatUnit(unit)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => removeIngredient(ingredient.productId)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TextInput
        style={styles.input}
        placeholder="Search products to add"
        value={productSearch}
        onChangeText={setProductSearch}
      />
      {productSearch.length > 0 ? (
        productResults.isLoading ? (
          <ActivityIndicator style={styles.productLoading} />
        ) : (
          <FlatList
            data={productResults.data?.items ?? []}
            keyExtractor={(product) => product.id}
            style={styles.productList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productOption} onPress={() => addIngredient(item.id, item.name)}>
                <Text style={styles.productOptionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.noProducts}>No products found.</Text>}
          />
        )
      ) : null}

      <Text style={styles.label}>Instructions</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Step by step instructions"
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitButton, (!canSubmit || isSubmitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{isEditing ? 'Save changes' : 'Create recipe'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  content: {
    padding: 16,
  },
  loading: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F0E8',
  },
  chipActive: {
    backgroundColor: '#B5541A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  ingredientRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DDD0',
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  ingredientName: {
    fontWeight: '600',
    color: '#2B2620',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#E5DDD0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 80,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F0E8',
  },
  unitChipActive: {
    backgroundColor: '#B5541A',
  },
  unitChipText: {
    fontSize: 12,
    color: '#6B6155',
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  removeText: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '600',
  },
  productLoading: {
    marginTop: 8,
  },
  productList: {
    maxHeight: 160,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DDD0',
  },
  productOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5DDD0',
  },
  productOptionText: {
    color: '#2B2620',
  },
  noProducts: {
    padding: 12,
    color: '#8A7F70',
  },
  error: {
    color: '#C0392B',
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#B5541A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
