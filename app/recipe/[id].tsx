import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRecipe } from '../../src/hooks/useRecipes';
import { useToggleSaveRecipe } from '../../src/hooks/useCookbook';
import { useAuth } from '../../src/context/AuthContext';
import { NutritionBar } from '../../src/components/NutritionBar';
import { ErrorState, LoadingState } from '../../src/components/EmptyState';
import { ApiError } from '../../src/api/client';
import { deleteRecipe } from '../../src/api/recipes.api';
import { formatUnit } from '../../src/lib/units';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const recipeQuery = useRecipe(id);
  const toggleSave = useToggleSaveRecipe(id);

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
  const isOwner = user?.id === recipe.author.id;
  const isSaved = recipe.isSaved ?? false;

  async function handleDelete() {
    await deleteRecipe(recipe.id);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{recipe.title}</Text>

      <Link href={{ pathname: '/user/[id]', params: { id: recipe.author.id } }} asChild>
        <TouchableOpacity>
          <Text style={styles.author}>by {recipe.author.username}</Text>
        </TouchableOpacity>
      </Link>

      {recipe.categories.length > 0 ? (
        <View style={styles.categoryRow}>
          {recipe.categories.map((category) => (
            <View key={category.id} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.description}>{recipe.description}</Text>

      <NutritionBar nutrition={recipe.nutrition} />

      {!isOwner ? (
        <TouchableOpacity
          style={[styles.saveButton, isSaved && styles.saveButtonActive]}
          onPress={() => toggleSave.mutate(isSaved)}
          disabled={toggleSave.isPending}
        >
          <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextActive]}>
            {isSaved ? 'Saved to cookbook' : 'Save to cookbook'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.ownerActions}>
          <Link href={{ pathname: '/recipe/new', params: { editId: recipe.id } }} asChild>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Ingredients</Text>
      {recipe.ingredients.map((ingredient) => (
        <View key={ingredient.productId} style={styles.ingredientRow}>
          <Text style={styles.ingredientText}>
            {ingredient.quantity} {formatUnit(ingredient.unit)} {ingredient.product.name}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Instructions</Text>
      <Text style={styles.instructions}>{recipe.instructions}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2620',
  },
  author: {
    fontSize: 14,
    color: '#B5541A',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6155',
  },
  description: {
    fontSize: 15,
    color: '#2B2620',
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#B5541A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: '#F5F0E8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButtonTextActive: {
    color: '#B5541A',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F0E8',
  },
  editButtonText: {
    color: '#2B2620',
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FBEAEA',
  },
  deleteButtonText: {
    color: '#C0392B',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B2620',
    marginTop: 24,
    marginBottom: 10,
  },
  ingredientRow: {
    paddingVertical: 6,
  },
  ingredientText: {
    fontSize: 15,
    color: '#2B2620',
  },
  instructions: {
    fontSize: 15,
    color: '#2B2620',
    lineHeight: 22,
  },
});
