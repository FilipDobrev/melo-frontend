import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { saveRecipe, unsaveRecipe } from '../api/recipes.api';
import type { Post } from '../api/schemas';
import type { Paginated } from '../api/pagination';

// A post's `recipe.isSaved` reflects the server's cookbook state as of that
// fetch, so the save button on a post card reads it straight off the post -
// no separate local "did I save this" cache to keep in sync.
// If the first save attempt 409s, the recipe was already in the cookbook,
// so we flip to saved instead of surfacing an error.
type FeedData = InfiniteData<Paginated<Post>>;

export function useToggleRecipeSaved(postId: string, recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isSaved: boolean): Promise<boolean> => {
      if (isSaved) {
        await unsaveRecipe(recipeId);
        return false;
      }
      try {
        await saveRecipe(recipeId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return true;
        }
        throw err;
      }
      return true;
    },
    onMutate: async (isSaved) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const previousPost = queryClient.getQueryData<Post>(['post', postId]);
      queryClient.setQueryData<Post>(['post', postId], (old) => applyOptimisticSave(old, recipeId, !isSaved));

      const previousFeed = queryClient.getQueriesData<FeedData>({ queryKey: ['feed'] });
      queryClient.setQueriesData<FeedData>({ queryKey: ['feed'] }, (old) =>
        applyOptimisticSaveToFeed(old, recipeId, !isSaved),
      );

      return { previousPost, previousFeed };
    },
    onError: (_err, _isSaved, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      context?.previousFeed?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['cookbook'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },
  });
}

function applyOptimisticSave(post: Post | undefined, recipeId: string, isSaved: boolean): Post | undefined {
  if (!post || post.recipe.id !== recipeId) return post;
  return { ...post, recipe: { ...post.recipe, isSaved } };
}

function applyOptimisticSaveToFeed(data: FeedData | undefined, recipeId: string, isSaved: boolean): FeedData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((post) => applyOptimisticSave(post, recipeId, isSaved) ?? post),
    })),
  };
}
