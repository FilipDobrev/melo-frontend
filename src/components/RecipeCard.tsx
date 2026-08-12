import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RecipeSummary } from '../api/schemas';

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <Link href={{ pathname: '/recipe/[id]', params: { id: recipe.id } }} asChild>
      <TouchableOpacity style={styles.card}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.author}>by {recipe.author.username}</Text>
          {recipe.categories.length > 0 ? (
            <Text style={styles.category}>{recipe.categories[0]?.name}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5DDD0',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2620',
  },
  description: {
    fontSize: 13,
    color: '#6B6155',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  author: {
    fontSize: 12,
    color: '#8A7F70',
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B5541A',
  },
});
