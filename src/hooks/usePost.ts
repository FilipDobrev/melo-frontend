import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getPost, getComments, addComment, deleteComment, setReaction, removeReaction, deletePost } from '../api/posts.api';
import type { Post } from '../api/schemas';
import type { Paginated } from '../api/pagination';

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId),
  });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) => getComments(postId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      // Feed cards show a comment count that must reflect the new comment too.
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      // Feed cards show a comment count that must reflect the deletion too.
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

type FeedData = InfiniteData<Paginated<Post>>;

export function useSetReaction(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emoji: string | null) => (emoji ? setReaction(postId, emoji) : removeReaction(postId)),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const previousPost = queryClient.getQueryData<Post>(['post', postId]);
      queryClient.setQueryData<Post>(['post', postId], (old) => (old ? applyOptimisticReaction(old, emoji) : old));

      const previousFeed = queryClient.getQueriesData<FeedData>({ queryKey: ['feed'] });
      queryClient.setQueriesData<FeedData>({ queryKey: ['feed'] }, (old) => applyOptimisticReactionToFeed(old, postId, emoji));

      return { previousPost, previousFeed };
    },
    onError: (_err, _emoji, context) => {
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
    },
  });
}

function applyOptimisticReactionToFeed(data: FeedData | undefined, postId: string, emoji: string | null): FeedData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((post) => (post.id === postId ? applyOptimisticReaction(post, emoji) : post)),
    })),
  };
}

export function applyOptimisticReaction(post: Post, emoji: string | null): Post {
  const byEmoji = { ...post.reactions.byEmoji };
  let total = post.reactions.total;

  if (post.reactions.mine) {
    byEmoji[post.reactions.mine] = Math.max(0, (byEmoji[post.reactions.mine] ?? 1) - 1);
    total -= 1;
  }
  if (emoji) {
    byEmoji[emoji] = (byEmoji[emoji] ?? 0) + 1;
    total += 1;
  }

  return { ...post, reactions: { total, byEmoji, mine: emoji } };
}
