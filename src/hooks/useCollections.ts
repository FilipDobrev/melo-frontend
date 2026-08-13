import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  listCollectionRecipes,
  addRecipeToCollection,
  removeRecipeFromCollection,
} from '../api/collections.api';

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: listCollections,
  });
}

export function useCollectionRecipes(collectionId: string) {
  return useInfiniteQuery({
    queryKey: ['collectionRecipes', collectionId],
    queryFn: ({ pageParam }) => listCollectionRecipes(collectionId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createCollection(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useRenameCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameCollection(collectionId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) => deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useAddRecipeToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => addRecipeToCollection(collectionId, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionRecipes', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['cookbook'] });
      // Adding to a collection also saves the recipe to the cookbook (see
      // API.md), so any post cards showing this recipe's `isSaved` need to
      // catch up too.
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}

export function useRemoveRecipeFromCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => removeRecipeFromCollection(collectionId, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionRecipes', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
