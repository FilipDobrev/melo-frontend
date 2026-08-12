import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRecipe, type CreateRecipeInput } from '../api/recipes.api';

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecipeInput) => createRecipe(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['userRecipes'] });
    },
  });
}
