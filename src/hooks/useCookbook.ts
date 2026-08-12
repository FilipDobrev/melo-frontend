import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookbook, saveRecipe, unsaveRecipe } from '../api/recipes.api';
import type { RecipeDetail } from '../api/schemas';

export function useCookbook(categorySlugs: string[]) {
  return useInfiniteQuery({
    queryKey: ['cookbook', categorySlugs],
    queryFn: ({ pageParam }) => getCookbook({ categorySlugs, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useToggleSaveRecipe(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isSaved: boolean) => (isSaved ? unsaveRecipe(recipeId) : saveRecipe(recipeId)),
    onMutate: async (isSaved) => {
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });
      const previous = queryClient.getQueryData<RecipeDetail>(['recipe', recipeId]);
      queryClient.setQueryData<RecipeDetail>(['recipe', recipeId], (old) =>
        old ? { ...old, isSaved: !isSaved } : old,
      );
      return { previous };
    },
    onError: (_err, _isSaved, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['recipe', recipeId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['cookbook'] });
    },
  });
}
