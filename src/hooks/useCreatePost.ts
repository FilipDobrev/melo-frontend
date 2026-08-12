import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/posts.api';

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { caption?: string; recipeId?: string; imageKeys: string[] }) => createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}
