import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiError, request } from './client';
import { keys } from './keys';
import { usePagedQuery } from './paging';
import { setSavedEverywhere } from './posts';
import { setRecipeSaved } from './recipes';
import { collectionSchema, pageSchema, savedRecipeSchema, type SavedRecipe } from './schemas';

export function useCookbook(categorySlugs: string[]) {
  return usePagedQuery<SavedRecipe>({
    queryKey: keys.cookbook.list(categorySlugs),
    fetchPage: (cursor) =>
      request('/users/me/cookbook', {
        query: { categorySlugs: categorySlugs.length > 0 ? categorySlugs.join(',') : undefined, cursor, limit: 20 },
        schema: pageSchema(savedRecipeSchema),
      }),
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, saved }: { recipeId: string; saved: boolean }) => setRecipeSaved(recipeId, saved),
    onMutate: ({ recipeId, saved }) => {
      setSavedEverywhere(queryClient, recipeId, saved);
      return { recipeId, previousSaved: !saved };
    },
    onError: (_error, _vars, context) => {
      if (context) setSavedEverywhere(queryClient, context.recipeId, context.previousSaved);
    },
    onSettled: (_data, _error, { recipeId }) => {
      void queryClient.invalidateQueries({ queryKey: keys.cookbook.root });
      void queryClient.invalidateQueries({ queryKey: keys.recipes.detail(recipeId) });
      void queryClient.invalidateQueries({ queryKey: keys.collections.root });
    },
  });
}

export function useCollections() {
  return useQuery({
    queryKey: keys.collections.list,
    queryFn: () => request('/users/me/collections', { schema: z.array(collectionSchema) }),
  });
}

/**
 * A 409 means the name is taken; let it propagate so the UI shows error.message.
 *
 * `recipeId` is passed to the create call itself rather than added in a
 * follow-up request: two separate requests can fail between them and leave
 * an empty collection behind.
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; recipeId?: string }) =>
      request('/users/me/collections', { method: 'POST', body: input, schema: collectionSchema }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: keys.collections.root });
      // Creating with a recipeId also saves that recipe to the cookbook server-side.
      if (variables.recipeId) void queryClient.invalidateQueries({ queryKey: keys.cookbook.root });
    },
  });
}

export function useRenameCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, name }: { collectionId: string; name: string }) =>
      request(`/users/me/collections/${collectionId}`, { method: 'PATCH', body: { name }, schema: collectionSchema }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.collections.root });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) => request(`/users/me/collections/${collectionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.collections.root });
    },
  });
}

export function useCollectionRecipes(collectionId: string | undefined) {
  const id = collectionId ?? '';
  return usePagedQuery<SavedRecipe>({
    queryKey: keys.collections.recipes(id),
    enabled: id.length > 0,
    fetchPage: (cursor) =>
      request(`/users/me/collections/${id}/recipes`, {
        query: { cursor, limit: 20 },
        schema: pageSchema(savedRecipeSchema),
      }),
  });
}

/**
 * Adding is expressed as an intent, not a toggle: a 409 ("already in the
 * collection") means the cookbook already looks the way the user asked for,
 * mirroring `setRecipeSaved` in recipes.ts.
 */
export function useAddRecipeToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipeId: string) => {
      try {
        await request(`/users/me/collections/${collectionId}/recipes`, { method: 'POST', body: { recipeId } });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
      }
    },
    onSuccess: (_data, recipeId) => {
      void queryClient.invalidateQueries({ queryKey: keys.collections.root });
      // Adding to a collection also saves the recipe to the cookbook server-side.
      void queryClient.invalidateQueries({ queryKey: keys.cookbook.root });
      setSavedEverywhere(queryClient, recipeId, true);
    },
  });
}

/** Does not unsave from the cookbook - removing from a collection leaves that alone. */
export function useRemoveRecipeFromCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) =>
      request(`/users/me/collections/${collectionId}/recipes/${recipeId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.collections.recipes(collectionId) });
      void queryClient.invalidateQueries({ queryKey: keys.collections.root });
    },
  });
}
