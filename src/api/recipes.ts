import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, request } from './client';
import { keys } from './keys';
import { usePagedQuery } from './paging';
import {
  imagePresetSchema,
  pageSchema,
  recipeDetailSchema,
  recipeSummarySchema,
  uploadTicketSchema,
  type RecipeSummary,
  type Unit,
} from './schemas';
import { z } from 'zod';

export type RecipeSort = 'newest' | 'oldest' | 'popular';

export interface IngredientInput {
  productId: string;
  quantity: number;
  unit: Unit;
}

export interface RecipeInput {
  title: string;
  description: string;
  instructions: string;
  ingredients: IngredientInput[];
  categorySlugs: string[];
  /** Either `preset:<slug>` or a storage key from the upload ticket. */
  imageKey?: string;
}

export function useRecipeSearch(search: string, categorySlugs: string[], sort: RecipeSort) {
  return usePagedQuery<RecipeSummary>({
    queryKey: keys.recipes.search(search, categorySlugs, sort),
    fetchPage: (cursor) =>
      request('/recipes', {
        query: {
          search: search || undefined,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs.join(',') : undefined,
          sort,
          cursor,
          limit: 20,
        },
        schema: pageSchema(recipeSummarySchema),
      }),
  });
}

export function useRecipe(recipeId: string | undefined) {
  const id = recipeId ?? '';
  return useQuery({
    queryKey: keys.recipes.detail(id),
    queryFn: () => request(`/recipes/${id}`, { schema: recipeDetailSchema }),
    enabled: id.length > 0,
  });
}

export function useImagePresets() {
  return useQuery({
    queryKey: keys.recipes.imagePresets,
    queryFn: () => request('/recipes/image-presets', { schema: z.array(imagePresetSchema) }),
    staleTime: Infinity,
  });
}

export function requestRecipeImageUpload(contentType: string, contentLength: number) {
  return request('/recipes/images/upload-url', {
    method: 'POST',
    body: { contentType, contentLength },
    schema: uploadTicketSchema,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeInput) =>
      request('/recipes', { method: 'POST', body: input, schema: recipeDetailSchema }),
    onSuccess: (recipe) => {
      queryClient.setQueryData(keys.recipes.detail(recipe.id), recipe);
      void queryClient.invalidateQueries({ queryKey: keys.recipes.root });
      // Creating a recipe also saves it to the author's own cookbook.
      void queryClient.invalidateQueries({ queryKey: keys.cookbook.root });
    },
  });
}

export function useUpdateRecipe(recipeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RecipeInput>) =>
      request(`/recipes/${recipeId}`, { method: 'PATCH', body: input, schema: recipeDetailSchema }),
    onSuccess: (recipe) => {
      queryClient.setQueryData(keys.recipes.detail(recipe.id), recipe);
      void queryClient.invalidateQueries({ queryKey: keys.recipes.root });
      void queryClient.invalidateQueries({ queryKey: keys.cookbook.root });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => request(`/recipes/${recipeId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.recipes.root });
      void queryClient.invalidateQueries({ queryKey: keys.cookbook.root });
      void queryClient.invalidateQueries({ queryKey: keys.posts.root });
    },
  });
}

/**
 * Saving is expressed as an intent, not a toggle of server state: a 409
 * ("already saved") and a 404 on unsave both mean the cookbook already looks
 * the way the user asked for, so neither is an error worth showing.
 */
export async function setRecipeSaved(recipeId: string, saved: boolean): Promise<void> {
  try {
    await request(`/recipes/${recipeId}/save`, { method: saved ? 'POST' : 'DELETE' });
  } catch (error) {
    const alreadyInTheRequestedState =
      error instanceof ApiError && (error.status === 409 || error.status === 404);
    if (!alreadyInTheRequestedState) throw error;
  }
}
