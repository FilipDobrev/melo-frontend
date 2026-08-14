import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { request } from './client';
import { keys } from './keys';
import { usePagedQuery } from './paging';
import {
  commentSchema,
  pageSchema,
  postSchema,
  reactionSummarySchema,
  uploadTicketSchema,
  type Comment,
  type Post,
  type ReactionSummary,
} from './schemas';

/** Narrows an unknown cached value to an infinite-query page shape. */
function isInfinitePages(value: unknown): value is { pages: unknown[]; pageParams: unknown[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pages' in value &&
    Array.isArray((value as { pages: unknown }).pages)
  );
}

/**
 * Narrows an unknown cached value to a bare `Post` (a detail-query result).
 * Checks the linked recipe too, because callers read `post.recipe.id` and any
 * other cached shape that happens to carry an `id` would blow up there.
 */
function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { id?: unknown; recipe?: { id?: unknown } };
  return typeof candidate.id === 'string' && typeof candidate.recipe?.id === 'string';
}

/**
 * The same post is cached in three shapes under the `posts` root: infinite
 * lists (feed, byUser) and the bare detail. This walks every cached value
 * under that root and rewrites any post it recognises, leaving everything
 * else untouched.
 */
export function updatePostEverywhere(
  queryClient: QueryClient,
  postId: string,
  update: (post: Post) => Post,
): void {
  queryClient.setQueriesData({ queryKey: keys.posts.root }, (cached: unknown) => {
    if (isInfinitePages(cached)) {
      return {
        ...cached,
        pages: cached.pages.map((page) => {
          if (
            typeof page !== 'object' ||
            page === null ||
            !('items' in page) ||
            !Array.isArray((page as { items: unknown }).items)
          ) {
            return page;
          }
          return {
            ...page,
            items: (page as { items: unknown[] }).items.map((item) =>
              isPost(item) && item.id === postId ? update(item) : item,
            ),
          };
        }),
      };
    }
    if (isPost(cached) && cached.id === postId) return update(cached);
    return cached;
  });
}

/** Patches `recipe.isSaved` on every post that links the given recipe. */
export function setSavedEverywhere(queryClient: QueryClient, recipeId: string, saved: boolean): void {
  queryClient.setQueriesData({ queryKey: keys.posts.root }, (cached: unknown) => {
    const patchPost = (post: Post): Post =>
      post.recipe.id === recipeId ? { ...post, recipe: { ...post.recipe, isSaved: saved } } : post;

    if (isInfinitePages(cached)) {
      return {
        ...cached,
        pages: cached.pages.map((page) => {
          if (
            typeof page !== 'object' ||
            page === null ||
            !('items' in page) ||
            !Array.isArray((page as { items: unknown }).items)
          ) {
            return page;
          }
          return {
            ...page,
            items: (page as { items: unknown[] }).items.map((item) => (isPost(item) ? patchPost(item) : item)),
          };
        }),
      };
    }
    if (isPost(cached)) return patchPost(cached);
    return cached;
  });
}

export function useFeed() {
  return usePagedQuery<Post>({
    queryKey: keys.posts.feed,
    fetchPage: (cursor) => request('/feed', { query: { cursor, limit: 20 }, schema: pageSchema(postSchema) }),
  });
}

export function usePost(postId: string | undefined) {
  const id = postId ?? '';
  return useQuery({
    queryKey: keys.posts.detail(id),
    queryFn: () => request(`/posts/${id}`, { schema: postSchema }),
    enabled: id.length > 0,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { caption?: string; recipeId: string; imageKeys: string[] }) =>
      request('/posts', { method: 'POST', body: input, schema: postSchema }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.posts.root });
    },
  });
}

export interface UpdatePostInput {
  /** Absent leaves the caption untouched; explicit null clears it. */
  caption?: string | null;
  recipeId?: string;
  /** Replaces the whole set, in order. Must contain 1..10 keys. */
  imageKeys?: string[];
}

/**
 * Not routed through `updatePostEverywhere`: an edit can change the image
 * set and the recipe, so a plain invalidate is simpler and more correct
 * than patching those shapes in place across every cache.
 */
export function useUpdatePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePostInput) =>
      request(`/posts/${postId}`, { method: 'PATCH', body: input, schema: postSchema }),
    onSuccess: (post) => {
      queryClient.setQueryData(keys.posts.detail(post.id), post);
      void queryClient.invalidateQueries({ queryKey: keys.posts.root });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => request(`/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: (_data, postId) => {
      queryClient.removeQueries({ queryKey: keys.posts.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: keys.posts.root });
    },
  });
}

/**
 * The server refuses to delete the last image on a post (400), so that
 * ApiError is left to propagate rather than swallowed here - the UI surfaces
 * its message.
 */
export function useDeletePostImage(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => request(`/posts/${postId}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.posts.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: keys.posts.root });
    },
  });
}

export function requestPostImageUpload(contentType: string, contentLength: number) {
  return request('/posts/images/upload-url', {
    method: 'POST',
    body: { contentType, contentLength },
    schema: uploadTicketSchema,
  });
}

export function useComments(postId: string | undefined) {
  const id = postId ?? '';
  return usePagedQuery<Comment>({
    queryKey: keys.posts.comments(id),
    enabled: id.length > 0,
    fetchPage: (cursor) =>
      request(`/posts/${id}/comments`, { query: { cursor, limit: 20 }, schema: pageSchema(commentSchema) }),
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      request(`/posts/${postId}/comments`, { method: 'POST', body: { content }, schema: commentSchema }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.posts.comments(postId) });
      updatePostEverywhere(queryClient, postId, (post) => ({ ...post, commentCount: post.commentCount + 1 }));
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      request(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.posts.comments(postId) });
      updatePostEverywhere(queryClient, postId, (post) => ({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      }));
    },
  });
}

/** Applies the optimistic reaction math for setting `emoji` as the viewer's own. */
function applySetReaction(reactions: Post['reactions'], emoji: string): Post['reactions'] {
  if (reactions.mine === emoji) return reactions; // no-op; the UI calls clear instead

  const byEmoji = { ...reactions.byEmoji };
  let total = reactions.total;

  if (reactions.mine === null) {
    byEmoji[emoji] = (byEmoji[emoji] ?? 0) + 1;
    total += 1;
  } else {
    const previousCount = (byEmoji[reactions.mine] ?? 0) - 1;
    if (previousCount <= 0) delete byEmoji[reactions.mine];
    else byEmoji[reactions.mine] = previousCount;
    byEmoji[emoji] = (byEmoji[emoji] ?? 0) + 1;
  }

  return { total, byEmoji, mine: emoji };
}

/** Applies the optimistic reaction math for clearing the viewer's own reaction. */
function applyClearReaction(reactions: Post['reactions']): Post['reactions'] {
  if (reactions.mine === null) return reactions;

  const byEmoji = { ...reactions.byEmoji };
  const previousCount = (byEmoji[reactions.mine] ?? 0) - 1;
  if (previousCount <= 0) delete byEmoji[reactions.mine];
  else byEmoji[reactions.mine] = previousCount;

  return { total: Math.max(0, reactions.total - 1), byEmoji, mine: null };
}

/**
 * Reads the current post out of the cache so a failed mutation can roll back.
 * This must not go through `updatePostEverywhere`: writing even an identical
 * value hands every post list a fresh object identity and re-renders the whole
 * feed, which is a lot of work to pay on every tap of a reaction.
 */
function snapshotPost(queryClient: QueryClient, postId: string): Post | undefined {
  for (const [, cached] of queryClient.getQueriesData({ queryKey: keys.posts.root })) {
    if (isPost(cached) && cached.id === postId) return cached;
    if (!isInfinitePages(cached)) continue;

    for (const page of cached.pages) {
      if (typeof page !== 'object' || page === null || !('items' in page)) continue;
      const items = (page as { items: unknown }).items;
      if (!Array.isArray(items)) continue;

      const match = items.find((item) => isPost(item) && item.id === postId);
      if (isPost(match)) return match;
    }
  }
  return undefined;
}

export function useSetReaction(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emoji: string) =>
      request(`/posts/${postId}/reactions`, { method: 'PUT', body: { emoji }, schema: reactionSummarySchema }),
    onMutate: (emoji: string) => {
      const previous = snapshotPost(queryClient, postId);
      updatePostEverywhere(queryClient, postId, (post) => ({
        ...post,
        reactions: applySetReaction(post.reactions, emoji),
      }));
      return { previous };
    },
    onError: (_error, _emoji, context) => {
      if (context?.previous) {
        const snapshot = context.previous;
        updatePostEverywhere(queryClient, postId, () => snapshot);
      }
    },
    onSuccess: (summary: ReactionSummary) => {
      updatePostEverywhere(queryClient, postId, (post) => ({ ...post, reactions: summary }));
    },
  });
}

export function useClearReaction(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request(`/posts/${postId}/reactions`, { method: 'DELETE' }),
    onMutate: () => {
      const previous = snapshotPost(queryClient, postId);
      updatePostEverywhere(queryClient, postId, (post) => ({
        ...post,
        reactions: applyClearReaction(post.reactions),
      }));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        const snapshot = context.previous;
        updatePostEverywhere(queryClient, postId, () => snapshot);
      }
    },
    // The DELETE returns 204, so the cleared summary already written in
    // onMutate is authoritative - nothing to reconcile from the response.
  });
}
