import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPost, getComments, addComment, deleteComment, setReaction, removeReaction, deletePost } from '../api/posts.api';
import type { Post } from '../api/schemas';

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

export function useSetReaction(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emoji: string | null) => (emoji ? setReaction(postId, emoji) : removeReaction(postId)),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData<Post>(['post', postId]);
      queryClient.setQueryData<Post>(['post', postId], (old) => {
        if (!old) return old;
        return applyOptimisticReaction(old, emoji);
      });
      return { previous };
    },
    onError: (_err, _emoji, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', postId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

function applyOptimisticReaction(post: Post, emoji: string | null): Post {
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
