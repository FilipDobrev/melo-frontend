import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { searchRecipes, getRecipe } from '../api/recipes.api';

export function useRecipes(search: string, categorySlugs: string[]) {
  return useInfiniteQuery({
    queryKey: ['recipes', search, categorySlugs],
    queryFn: ({ pageParam }) => searchRecipes({ search: search || undefined, categorySlugs, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useRecipe(recipeId: string) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => getRecipe(recipeId),
  });
}
