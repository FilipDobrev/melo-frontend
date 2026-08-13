import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { searchRecipes, getRecipe, type RecipeSort } from '../api/recipes.api';

export function useRecipes(search: string, categorySlugs: string[], sort?: RecipeSort) {
  return useInfiniteQuery({
    queryKey: ['recipes', search, categorySlugs, sort],
    queryFn: ({ pageParam }) =>
      searchRecipes({ search: search || undefined, categorySlugs, sort, cursor: pageParam }),
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
